module.exports.capitalizeWords = function(string) {
    return string.replace(/\b\w/g, l => l.toUpperCase())
}