export COMPOSE_FILE=deployment/docker-compose.yml:deployment/docker-compose.override.yml
SHELL := /bin/bash

build:
	@echo
	@echo "------------------------------------------------------------------"
	@echo "Building in production mode"
	@echo "------------------------------------------------------------------"
	@docker compose build

up:
	@echo
	@echo "------------------------------------------------------------------"
	@echo "Running in production mode"
	@echo "------------------------------------------------------------------"
	@docker compose ${ARGS} up -d nginx django

dev:
	@echo
	@echo "------------------------------------------------------------------"
	@echo "Running in dev mode"
	@echo "------------------------------------------------------------------"
	@docker compose ${ARGS} up --no-recreate -d dev redis worker

test:
	@echo
	@echo "------------------------------------------------------------------"
	@echo "Running in test mode"
	@echo "------------------------------------------------------------------"
	@docker compose ${ARGS} up --no-recreate -d dev

serve:
	@echo
	@echo "------------------------------------------------------------------"
	@echo "Execute webpack serve command"
	@echo "------------------------------------------------------------------"
	@docker compose ${ARGS} exec -T dev npm --prefix /home/web/django_project/frontend run serve

down:
	@echo
	@echo "------------------------------------------------------------------"
	@echo "Removing production instance!!! "
	@echo "------------------------------------------------------------------"
	@docker compose ${ARGS} down

wait-db:
	@docker compose ${ARGS} exec -T db su - postgres -c "until pg_isready; do sleep 5; done"

sleep:
	@echo
	@echo "------------------------------------------------------------------"
	@echo "Sleep for 10 seconds"
	@echo "------------------------------------------------------------------"
	@sleep 10
	@echo "Done"

migrate:
	@echo
	@echo "------------------------------------------------------------------"
	@echo "Running migration"
	@echo "------------------------------------------------------------------"
	@docker compose ${ARGS} exec -T dev python manage.py migrate

npm-install:
	@echo
	@echo "------------------------------------------------------------------"
	@echo "Install frontend dependencies"
	@echo "------------------------------------------------------------------"
	@docker compose ${ARGS} exec -T dev npm --prefix /home/web/django_project/frontend install

build-react:
	@echo
	@echo "------------------------------------------------------------------"
	@echo "Execute webpack build command"
	@echo "------------------------------------------------------------------"
	@docker compose ${ARGS} exec -T dev npm --prefix /home/web/django_project/frontend run build

dev-runserver:
	@echo
	@echo "------------------------------------------------------------------"
	@echo "Start django runserver in dev container"
	@echo "------------------------------------------------------------------"
	@docker compose $(ARGS) exec -T dev bash -c "nohup python manage.py runserver 0.0.0.0:8080 &"
