const validNameRegex = RegExp(/^[\w-]{3,20}$/);

export default function isValidName(name) {
    return validNameRegex.test(name);
}