import path from "path";
import { v4 as uuidv4 } from 'uuid';

export function root() {
    return path.join(
        __dirname,
        '..',
        'uploads'
    )
}

export function signID() {
    const uuid = uuidv4();
    return 'sso-lite.' + uuid;
}

export function getPath(...paths: string[]) {
    return path.join(root(), ...paths);
}