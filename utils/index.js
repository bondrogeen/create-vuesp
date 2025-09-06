const parse = (text, platform) => {
    const lines = text.split('\n').filter(i => !i.startsWith(';'))
    let name = null
    const groupe = {}
    lines.forEach(line => {
        const find = line.match(/\[(.*)\]/)
        if (find) {
            name = find[1]
        }
        if (!name) return
        if (!groupe[name]) groupe[name] = ''
        groupe[name] += `${line}\n`
    });

    for (const key in groupe) {
        if (key.startsWith('env:')) {
            if (key !== `env:${platform}`) {
                delete groupe[key];
            }
        }
    }
    let newText = ''

    for (const key in groupe) {
        newText += groupe[key]
    }

    return newText
}
export { parse }