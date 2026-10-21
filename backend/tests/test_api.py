"""Testes da API do UniRide.

Rodam com a biblioteca padrão (unittest) e um banco SQLite temporário, sem tocar
em backend/uniride.db. A partir da pasta backend/:

    python -m unittest discover -s tests -v
"""
import os
import tempfile
import threading
import unittest

from app import create_app


class ApiTestCase(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self._previous_db = os.environ.get("DATABASE_URL")
        os.environ["DATABASE_URL"] = os.path.join(self._tmp.name, "test.db")
        self.app = create_app()
        self.app.testing = True

    def tearDown(self):
        if self._previous_db is None:
            os.environ.pop("DATABASE_URL", None)
        else:
            os.environ["DATABASE_URL"] = self._previous_db
        self._tmp.cleanup()

    # -- auxiliares ---------------------------------------------------------
    def new_client(self):
        return self.app.test_client()

    def register(self, client, email, password="senha123", profile=True):
        response = client.post("/api/auth/register", json={"email": email, "password": password})
        self.assertEqual(response.status_code, 201, response.get_json())
        if profile:
            name = email.split("@")[0].title()
            saved = client.put(
                "/api/profile",
                json={"name": name, "course": "Engenharia", "phone": "(44) 99999-0000", "bio": ""},
            )
            self.assertEqual(saved.status_code, 200, saved.get_json())
        return response.get_json()["user"]

    def create_ride(self, client, **overrides):
        payload = {"from": "Campus", "to": "Centro", "time": "18:40", "seats": 2}
        payload.update(overrides)
        return client.post("/api/rides", json=payload)


class AuthTests(ApiTestCase):
    def test_register_login_me_logout(self):
        client = self.new_client()
        user = self.register(client, "ana@uni.edu.br", profile=False)
        self.assertEqual(user["email"], "ana@uni.edu.br")
        self.assertNotIn("password", user)

        self.assertEqual(client.get("/api/auth/me").status_code, 200)
        self.assertEqual(client.post("/api/auth/logout").status_code, 200)
        self.assertEqual(client.get("/api/auth/me").status_code, 401)

        login = client.post("/api/auth/login", json={"email": "ANA@uni.edu.br ", "password": "senha123"})
        self.assertEqual(login.status_code, 200)
        self.assertEqual(client.get("/api/auth/me").status_code, 200)

    def test_register_validation(self):
        client = self.new_client()
        cases = [
            ({}, 400),
            ({"email": "ana@uni.edu.br"}, 400),
            ({"email": "sem-arroba", "password": "senha123"}, 400),
            ({"email": "ana@uni.edu.br", "password": "123"}, 400),
            ({"email": "ana@uni.edu.br", "password": "x" * 129}, 400),
            ({"email": 123, "password": "senha123"}, 400),
        ]
        for payload, expected in cases:
            with self.subTest(payload=payload):
                self.assertEqual(client.post("/api/auth/register", json=payload).status_code, expected)

    def test_register_duplicate_email(self):
        self.register(self.new_client(), "ana@uni.edu.br", profile=False)
        response = self.new_client().post(
            "/api/auth/register", json={"email": "Ana@uni.edu.br", "password": "senha123"}
        )
        self.assertEqual(response.status_code, 409)

    def test_login_wrong_password(self):
        self.register(self.new_client(), "ana@uni.edu.br", profile=False)
        response = self.new_client().post("/api/auth/login", json={"email": "ana@uni.edu.br", "password": "errada1"})
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.get_json()["error"], "E-mail ou senha incorretos.")

    def test_passwords_are_hashed(self):
        import sqlite3

        self.register(self.new_client(), "ana@uni.edu.br", password="senha123", profile=False)
        stored = sqlite3.connect(os.environ["DATABASE_URL"]).execute("SELECT password FROM users").fetchone()[0]
        self.assertNotEqual(stored, "senha123")


class ProfileTests(ApiTestCase):
    def test_requires_authentication(self):
        client = self.new_client()
        self.assertEqual(client.get("/api/profile").status_code, 401)
        self.assertEqual(client.put("/api/profile", json={}).status_code, 401)
        self.assertEqual(client.get("/api/profile/rides").status_code, 401)

    def test_save_and_read_profile(self):
        client = self.new_client()
        self.register(client, "ana@uni.edu.br", profile=False)
        saved = client.put(
            "/api/profile",
            json={"name": " Ana Souza ", "course": "Direito", "phone": "44999990000", "bio": "Oi"},
        )
        self.assertEqual(saved.status_code, 200)
        profile = client.get("/api/profile").get_json()["profile"]
        self.assertEqual(profile["name"], "Ana Souza")
        self.assertEqual(profile["course"], "Direito")

    def test_profile_validation(self):
        client = self.new_client()
        self.register(client, "ana@uni.edu.br", profile=False)
        for payload in (
            {},
            {"name": "Ana", "course": "", "phone": "1"},
            {"name": "Ana", "course": "Direito", "phone": "x" * 31},
            {"name": 5, "course": "Direito", "phone": "1"},
        ):
            with self.subTest(payload=payload):
                self.assertEqual(client.put("/api/profile", json=payload).status_code, 400)

    def test_bio_is_truncated_and_tolerates_wrong_type(self):
        client = self.new_client()
        self.register(client, "ana@uni.edu.br", profile=False)
        base = {"name": "Ana", "course": "Direito", "phone": "1"}
        saved = client.put("/api/profile", json={**base, "bio": "a" * 900})
        self.assertEqual(len(saved.get_json()["profile"]["bio"]), 500)
        self.assertEqual(client.put("/api/profile", json={**base, "bio": 123}).status_code, 200)


class RideTests(ApiTestCase):
    def test_creating_requires_login(self):
        self.assertEqual(self.create_ride(self.new_client()).status_code, 401)

    def test_create_and_list(self):
        driver = self.new_client()
        self.register(driver, "motorista@uni.edu.br")
        created = self.create_ride(driver, seats=3)
        self.assertEqual(created.status_code, 201)
        ride = created.get_json()["ride"]
        self.assertEqual(ride["seats_remaining"], 3)
        self.assertEqual(ride["driver"], "Motorista")

        listed = self.new_client().get("/api/rides").get_json()["rides"]
        self.assertEqual([item["id"] for item in listed], [ride["id"]])

    def test_ride_validation(self):
        driver = self.new_client()
        self.register(driver, "motorista@uni.edu.br")
        invalid = [
            {"from": ""},
            {"to": "   "},
            {"time": ""},
            {"time": "25:00"},
            {"time": "99:99"},
            {"time": "7:5"},
            {"seats": 0},
            {"seats": 9},
            {"seats": 2.5},
            {"seats": True},
            {"seats": "abc"},
            {"from": "x" * 121},
            {"from": 123},
        ]
        for overrides in invalid:
            with self.subTest(overrides=overrides):
                self.assertEqual(self.create_ride(driver, **overrides).status_code, 400)
        self.assertEqual(self.create_ride(driver, seats="3").status_code, 201)
        self.assertEqual(self.create_ride(driver, time="00:00").status_code, 201)

    def test_join_updates_seats_and_leave_restores_them(self):
        driver, passenger = self.new_client(), self.new_client()
        self.register(driver, "motorista@uni.edu.br")
        self.register(passenger, "passageiro@uni.edu.br")
        ride_id = self.create_ride(driver, seats=2).get_json()["ride"]["id"]

        joined = passenger.post(f"/api/rides/{ride_id}/join")
        self.assertEqual(joined.status_code, 200)
        ride = joined.get_json()["ride"]
        self.assertEqual(ride["seats_remaining"], 1)
        self.assertEqual(ride["participant_count"], 1)
        self.assertTrue(ride["is_participating"])

        left = passenger.delete(f"/api/rides/{ride_id}/leave")
        self.assertEqual(left.status_code, 200)
        ride = left.get_json()["ride"]
        self.assertEqual(ride["seats_remaining"], 2)
        self.assertFalse(ride["is_participating"])

    def test_join_rules(self):
        driver, first, second = self.new_client(), self.new_client(), self.new_client()
        self.register(driver, "motorista@uni.edu.br")
        self.register(first, "um@uni.edu.br")
        self.register(second, "dois@uni.edu.br")
        ride_id = self.create_ride(driver, seats=1).get_json()["ride"]["id"]

        self.assertEqual(self.new_client().post(f"/api/rides/{ride_id}/join").status_code, 401)
        self.assertEqual(driver.post(f"/api/rides/{ride_id}/join").status_code, 400)
        self.assertEqual(first.post("/api/rides/9999/join").status_code, 404)
        self.assertEqual(first.post(f"/api/rides/{ride_id}/join").status_code, 200)
        self.assertEqual(first.post(f"/api/rides/{ride_id}/join").status_code, 400)  # lotada
        self.assertEqual(second.post(f"/api/rides/{ride_id}/join").status_code, 400)
        self.assertEqual(second.delete(f"/api/rides/{ride_id}/leave").status_code, 404)
        self.assertEqual(self.new_client().delete(f"/api/rides/{ride_id}/leave").status_code, 401)

    def test_full_ride_leaves_public_list_but_stays_for_participant(self):
        driver, passenger, other = self.new_client(), self.new_client(), self.new_client()
        self.register(driver, "motorista@uni.edu.br")
        self.register(passenger, "passageiro@uni.edu.br")
        self.register(other, "outro@uni.edu.br")
        ride_id = self.create_ride(driver, seats=1).get_json()["ride"]["id"]
        passenger.post(f"/api/rides/{ride_id}/join")

        self.assertEqual(other.get("/api/rides").get_json()["rides"], [])
        mine = passenger.get("/api/rides").get_json()["rides"]
        self.assertEqual([r["id"] for r in mine], [ride_id])
        self.assertTrue(mine[0]["is_participating"])

        passenger.delete(f"/api/rides/{ride_id}/leave")
        self.assertEqual([r["id"] for r in other.get("/api/rides").get_json()["rides"]], [ride_id])

    def test_last_seat_is_not_oversold_under_concurrency(self):
        driver = self.new_client()
        self.register(driver, "motorista@uni.edu.br")
        ride_id = self.create_ride(driver, seats=1).get_json()["ride"]["id"]
        clients = []
        for index in range(6):
            client = self.new_client()
            self.register(client, f"p{index}@uni.edu.br", profile=False)
            clients.append(client)

        statuses = []

        def attempt(client):
            statuses.append(client.post(f"/api/rides/{ride_id}/join").status_code)

        threads = [threading.Thread(target=attempt, args=(client,)) for client in clients]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join()

        self.assertEqual(statuses.count(200), 1, statuses)
        ride = driver.get(f"/api/rides/{ride_id}").get_json()["ride"]
        self.assertEqual(ride["participant_count"], 1)

    def test_search_ignores_case_accents_and_wildcards(self):
        driver = self.new_client()
        self.register(driver, "motorista@uni.edu.br")
        self.create_ride(driver, **{"from": "Maringá", "to": "Uningá"})
        self.create_ride(driver, **{"from": "Sarandi", "to": "Centro"})
        client = self.new_client()

        def ids(query):
            return [r["from_loc"] for r in client.get(f"/api/rides?{query}").get_json()["rides"]]

        self.assertEqual(ids("from=maringa"), ["Maringá"])
        self.assertEqual(ids("from=MARINGÁ&to=uninga"), ["Maringá"])
        self.assertEqual(ids("to=centro"), ["Sarandi"])
        self.assertEqual(ids("from=nao-existe"), [])
        self.assertEqual(ids("from=%25"), [])  # '%' é literal, não curinga
        self.assertEqual(len(ids("")), 2)

    def test_pagination_parameters(self):
        client = self.new_client()
        self.assertEqual(client.get("/api/rides?limit=abc").status_code, 400)
        self.assertEqual(client.get("/api/rides?offset=x").status_code, 400)
        self.assertEqual(client.get("/api/rides?limit=-5&offset=-1").status_code, 200)
        self.assertEqual(client.get("/api/rides?limit=999").get_json()["pagination"]["limit"], 50)

    def test_driver_phone_is_private(self):
        driver, passenger, outsider = self.new_client(), self.new_client(), self.new_client()
        self.register(driver, "motorista@uni.edu.br")
        self.register(passenger, "passageiro@uni.edu.br")
        self.register(outsider, "outro@uni.edu.br")
        ride_id = self.create_ride(driver, seats=3).get_json()["ride"]["id"]

        def phone_for(client):
            return client.get("/api/rides").get_json()["rides"][0]["driver_phone"]

        self.assertIsNone(phone_for(self.new_client()))
        self.assertIsNone(phone_for(outsider))
        self.assertIsNone(phone_for(passenger))
        self.assertEqual(phone_for(driver), "(44) 99999-0000")

        joined = passenger.post(f"/api/rides/{ride_id}/join").get_json()["ride"]
        self.assertEqual(joined["driver_phone"], "(44) 99999-0000")
        self.assertEqual(phone_for(passenger), "(44) 99999-0000")
        left = passenger.delete(f"/api/rides/{ride_id}/leave").get_json()["ride"]
        self.assertIsNone(left["driver_phone"])
        self.assertIsNone(self.new_client().get(f"/api/rides/{ride_id}").get_json()["ride"]["driver_phone"])

    def test_get_ride_and_not_found(self):
        driver = self.new_client()
        self.register(driver, "motorista@uni.edu.br")
        ride_id = self.create_ride(driver).get_json()["ride"]["id"]
        self.assertEqual(self.new_client().get(f"/api/rides/{ride_id}").status_code, 200)
        self.assertEqual(self.new_client().get("/api/rides/9999").status_code, 404)

    def test_delete_ride_permissions(self):
        driver, other = self.new_client(), self.new_client()
        self.register(driver, "motorista@uni.edu.br")
        self.register(other, "outro@uni.edu.br")
        ride_id = self.create_ride(driver).get_json()["ride"]["id"]

        self.assertEqual(self.new_client().delete(f"/api/rides/{ride_id}").status_code, 401)
        self.assertEqual(other.delete(f"/api/rides/{ride_id}").status_code, 403)
        self.assertEqual(driver.delete("/api/rides/9999").status_code, 404)
        self.assertEqual(driver.delete(f"/api/rides/{ride_id}").status_code, 200)
        self.assertEqual(driver.get(f"/api/rides/{ride_id}").status_code, 404)

    def test_profile_rides_lists_only_own_rides_with_counts(self):
        driver, passenger = self.new_client(), self.new_client()
        self.register(driver, "motorista@uni.edu.br")
        self.register(passenger, "passageiro@uni.edu.br")
        ride_id = self.create_ride(driver, seats=3).get_json()["ride"]["id"]
        passenger.post(f"/api/rides/{ride_id}/join")

        mine = driver.get("/api/profile/rides").get_json()["rides"]
        self.assertEqual(len(mine), 1)
        self.assertEqual(mine[0]["participant_count"], 1)
        self.assertEqual(mine[0]["seats_remaining"], 2)
        self.assertEqual(passenger.get("/api/profile/rides").get_json()["rides"], [])


class MiscTests(ApiTestCase):
    def test_json_errors_for_unknown_routes_and_methods(self):
        client = self.new_client()
        missing = client.get("/api/nao-existe")
        self.assertEqual(missing.status_code, 404)
        self.assertIn("error", missing.get_json())
        wrong_method = client.patch("/api/rides")
        self.assertEqual(wrong_method.status_code, 405)
        self.assertIn("error", wrong_method.get_json())

    def test_cors_allows_configured_origin_with_credentials(self):
        response = self.new_client().get("/api/rides", headers={"Origin": "http://localhost:5173"})
        self.assertEqual(response.headers.get("Access-Control-Allow-Origin"), "http://localhost:5173")
        self.assertEqual(response.headers.get("Access-Control-Allow-Credentials"), "true")
        blocked = self.new_client().get("/api/rides", headers={"Origin": "http://evil.example"})
        self.assertIsNone(blocked.headers.get("Access-Control-Allow-Origin"))

    def test_env_file_loader_does_not_override_environment(self):
        from app.config import load_env_file

        env_path = os.path.join(self._tmp.name, ".env")
        with open(env_path, "w", encoding="utf-8") as handle:
            handle.write('# comentário\nUNIRIDE_TEST_A=valor\nUNIRIDE_TEST_B="entre aspas"\nUNIRIDE_TEST_C=do-arquivo\n')
        os.environ["UNIRIDE_TEST_C"] = "do-sistema"
        try:
            load_env_file(env_path)
            self.assertEqual(os.environ["UNIRIDE_TEST_A"], "valor")
            self.assertEqual(os.environ["UNIRIDE_TEST_B"], "entre aspas")
            self.assertEqual(os.environ["UNIRIDE_TEST_C"], "do-sistema")
        finally:
            for key in ("UNIRIDE_TEST_A", "UNIRIDE_TEST_B", "UNIRIDE_TEST_C"):
                os.environ.pop(key, None)


if __name__ == "__main__":
    unittest.main()
