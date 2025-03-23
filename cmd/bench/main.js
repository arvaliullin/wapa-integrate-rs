const fs = require("fs/promises");
const path = require("path");

/**
 * BenchmarkRunner для выполнения функций из Rust WebAssembly.
 */
class BenchmarkRunner {
    constructor(wasmPackagePath, argsPath) {
        this.pkgPath = wasmPackagePath;
        this.argsPath = argsPath;
        this.module = null;
    }

    /**
     * Проверка существования файла.
     * @param {string} filePath
     */
    async checkFileExists(filePath) {
        try {
            await fs.access(filePath);
        } catch (err) {
            throw new Error(`Файл не найден: ${filePath}`);
        }
    }

    /**
     * Загрузка JSON-файла.
     * @param {string} filePath
     * @returns {Promise<object>}
     */
    async loadJSON(filePath) {
        await this.checkFileExists(filePath);
        try {
            const data = await fs.readFile(filePath, "utf8");
            return JSON.parse(data);
        } catch (err) {
            throw new Error(`Ошибка чтения или парсинга JSON файла ${filePath}: ${err.message}`);
        }
    }

    /**
     * Динамическая загрузка Rust WebAssembly модуля.
     */
    async loadWasmModule() {
        try {
            const resolvedPath = path.resolve(this.pkgPath);
            this.module = require(resolvedPath);
        } catch (err) {
            throw new Error(`Ошибка загрузки WASM Rust модуля из ${this.pkgPath}: ${err.message}`);
        }
    }

    async run() {
        try {
            await this.checkFileExists(this.pkgPath);
            const argsData = await this.loadJSON(this.argsPath);

            await this.loadWasmModule();

            const functions = argsData.functions || [];
            if (!Array.isArray(functions) || functions.length === 0) {
                throw new Error("Массив 'functions' в JSON пустой или некорректный.");
            }

            for (let i = 0; i < functions.length; i++) {
                const func = functions[i];
                const funcName = func.function;
                const funcArgs = func.args || [];

                if (!funcName) {
                    console.warn(`Функция с индексом ${i} не имеет имени 'function'. Пропуск...`);
                    continue;
                }

                if (typeof this.module[funcName] !== "function") {
                    console.error(`[Ошибка] Функция '${funcName}' не существует в модуле.`);
                    continue;
                }

                await this.runFunction(i, funcName, funcArgs);
            }
        } catch (err) {
            console.error(`[Ошибка] ${err.message}`);
        }
    }

    /**
     * Выполнение отдельной функции из WASM.
     * @param {number} index Индекс функции в массиве
     * @param {string} funcName Название функции
     * @param {Array} funcArgs Аргументы функции
     */
    async runFunction(index, funcName, funcArgs) {
        try {
            const start = performance.now();
            const resultValue = this.module[funcName](...funcArgs); // вызов функции с аргументами
            const end = performance.now();

            this.logResult(index, funcName, funcArgs, resultValue, end - start);
        } catch (err) {
            console.error(`[Ошибка] Не удалось выполнить функцию '${funcName}' с индексом ${index}: ${err.message}`);
        }
    }

    /**
     * Логирование результата выполнения функции.
     * @param {number} index Индекс функции в массиве
     * @param {string} funcName Название функции
     * @param {Array} funcArgs Аргументы функции
     * @param {*} resultValue Результат выполнения
     * @param {number} execTime Время выполнения (мс)
     */
    logResult(index, funcName, funcArgs, resultValue, execTime) {
        console.log(`\n[Функция #${index}]`);
        console.log(`Имя: ${funcName}`);
        console.log(`Аргументы: ${JSON.stringify(funcArgs)}`);
        console.log(`Результат: ${resultValue}`);
        console.log(`Время выполнения: ${execTime.toFixed(2)} мс`);
    }
}

async function main() {
    if (process.argv.length < 4) {
        console.error("Использование: bun cmd/bench/main.js ./pkg/wapa_integrate_rs.js./configs/wapa.json");
        process.exit(1);
    }

    const wasmPackagePath = path.resolve(process.cwd(), process.argv[2]);
    const argsFile = path.resolve(process.cwd(), process.argv[3]);
    const runner = new BenchmarkRunner(wasmPackagePath, argsFile);
    await runner.run();
}

main();
