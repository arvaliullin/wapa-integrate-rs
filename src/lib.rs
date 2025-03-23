mod utils;

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet() {
    alert("Hello, wapa-integrate-rs!");
}


fn f(x: f64) -> f64 {
    x * x
}

#[wasm_bindgen]
pub extern "C" fn x2Integrate(xmin: f64, xmax: f64, intervals_count: i32) -> f64 {
    let dx = (xmax - xmin) / (intervals_count as f64);
    let mut total = 0.0;
    let mut x = xmin;

    for i in 1..intervals_count {
        total = total + dx * (f(x) + f(x + dx)) / 2.0;
        x = x + dx;
    }

    total
}
