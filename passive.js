let passive = false;
let impassive = false;
try {
    let opts = Object.defineProperty({}, 'passive', {
        get: function () {
            passive = { passive: true }
            impassive = { passive: false }
            return true
        }
    })
    window.addEventListener("test", null, opts)
} catch (e) { }

export default {
    passive,
    impassive
}