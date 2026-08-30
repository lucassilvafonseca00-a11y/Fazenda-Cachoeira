# Fazenda Cachoeira

Aplicativo para registrar aplicações agrícolas por talhão com suporte a múltiplas fazendas e visualização compartilhada.

## Como executar localmente

```bash
pip install -r requirements.txt
python app.py
```

Acesse:

- http://127.0.0.1:8000/
- http://127.0.0.1:8000/visualizacao.html?fazenda=cachoeira
- http://127.0.0.1:8000/visualizacao.html?fazenda=berrador

## Recursos

- Talhões de café cadastrados com os dados da tabela enviada.
- Cadastro de fazenda Cachoeira e Berrador.
- Registro de defensivos, fertilizantes e corretivos.
- Dose por hectare e cálculo automático da quantidade total.
- Vários produtos no mesmo registro de aplicação.
- Histórico compartilhado por fazenda em servidor.
- Visualização em leitura para outras pessoas.

## Preparado para nuvem

Este projeto já está pronto para ser implantado em serviços como Render, Railway ou VPS Linux.

### Render (recomendado)

1. Crie uma conta no Render.
2. Clique em New + > Web Service.
3. Conecte este repositório no GitHub.
4. Configure:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn app:app --bind 0.0.0.0:$PORT`
5. Clique em Create Web Service.

### Railway

1. Crie uma conta no Railway.
2. Importe este repositório.
3. Escolha a opção Python.
4. Defina o start command:
   - `gunicorn app:app --bind 0.0.0.0:$PORT`
5. Faça o deploy.

### VPS / servidor Linux

```bash
pip install -r requirements.txt
gunicorn app:app --bind 0.0.0.0:8000
```

## Observações importantes

- A versão atual usa um arquivo central de dados para sincronizar em um único servidor.
- Para sincronização em produção com muitos usuários e alta confiabilidade, o ideal é migrar para PostgreSQL ou MySQL.
- Ainda assim, o projeto já está no caminho correto para implantação em nuvem.
