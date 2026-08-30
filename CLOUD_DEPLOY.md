# Deploy na nuvem

## 1) Preparar o projeto

- Certifique-se de que o arquivo `requirements.txt` contém:

  Flask==3.0.3
gunicorn==22.0.0

- O app principal é `app.py`.
- O comando de inicialização da nuvem deve ser:

  gunicorn app:app --bind 0.0.0.0:$PORT

## 2) Opção recomendada: Render

1. Entre no Render.
2. Clique em "New" > "Web Service".
3. Conecte este repositório do GitHub.
4. Configure:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn app:app --bind 0.0.0.0:$PORT`
5. Clique em "Create Web Service".
6. Aguarde o deploy.
7. Copie a URL pública gerada, por exemplo:
   `https://fazenda-cachoeira.onrender.com`

## 3) Usar as rotas do app

- Cadastro da fazenda: `https://SEU-URL/`
- Visualização da Cachoeira: `https://SEU-URL/visualizacao.html?fazenda=cachoeira`
- Visualização do Berrador: `https://SEU-URL/visualizacao.html?fazenda=berrador`

## 4) Importante

A versão atual usa um arquivo compartilhado como base de dados local do servidor. Isso já permite sincronização entre usuários conectados ao mesmo servidor, mas para produção com muitos acessos e maior confiabilidade, a próxima etapa é migrar para PostgreSQL ou MySQL.

## 5) Próximo passo recomendado

- manter o padrão atual de fazenda por cadastro
- separar acesso por perfil (cadastro e leitura)
- depois migrar para banco SQL em produção
