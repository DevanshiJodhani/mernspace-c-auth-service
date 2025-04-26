function welcome(name: string) {
    console.log('Hello')
    console.log('Welcome')

    const user = {
        name: 'Devanshi',
    }

    const fname = user.name

    return name + fname
}

welcome('Devanshi')
