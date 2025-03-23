
all: bench

build:
	wasm-pack build --target nodejs

bench: build
	bun cmd/bench/main.js ./pkg/wapa_integrate_rs.js ./configs/wapa.json

pkg: build
	@echo "Выполняется сборка пакета... (pkg)"
	mkdir -p out
	cp configs/wapa.json out/wapa.json
	cp pkg/wapa_integrate_rs.js out/wapa_integrate_rs.js
	cp pkg/wapa_integrate_rs_bg.wasm out/wapa_integrate_rs_bg.wasm
	zip -r pkg.zip out/*

.PHONY: all build bench pkg
