from app import create_app

app = create_app()

if __name__ == "__main__":
    # debug=True mostra erros detalhados durante o desenvolvimento
    app.run(debug=True, port=5000)
