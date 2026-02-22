.PHONY: up build preview lint typecheck test check clean install pairs

# Dev server accessible sur le réseau local
up:
	npm run dev

# Build production
build:
	npm run build

# Preview du build de prod (réseau local)
preview:
	npm run preview

# Lint
lint:
	npm run lint

# Type check
typecheck:
	npm run typecheck

# Lint + typecheck (comme la CI)
check: lint typecheck test

# Tests
test:
	npm run test

# Install des dépendances
install:
	npm ci

# Aperçu des paires (génère pairs.html et ouvre dans le navigateur)
pairs:
	node pairs-preview.mjs && xdg-open pairs.html

# Clean
clean:
	rm -rf dist node_modules
