const validNameRegex = RegExp(/^[\w-]{3,20}$/);

const isValidName = (name) => {
    return validNameRegex.test(name);
}

export {isValidName};