FROM python:alpine3.19


# Set working directory to /app. Thios will be the current directory .
WORKDIR /app

COPY requirements.txt .


RUN python -V
RUN pip install --no-cache-dir -r requiremants.txt

COPY . .


CMD [ "python", "/app/main.py" ]

















