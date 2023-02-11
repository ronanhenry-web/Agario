import crypto from "crypto";
import fs from "fs";
import jwt from "jsonwebtoken";

export class Auth {
    static hasherMdp(mdp:string, salt:string|null) {
        if (!salt) {
            salt = crypto.randomBytes(32).toString("hex");
        }
        const hashMdp = crypto.scryptSync(mdp, salt, 64).toString("hex");
        return {hashMdp, salt};
    }

    static comparerMotsDePasses(mdpTest:string, mdpBDD:string, salt:string) {
        const hashMdpTest = (this.hasherMdp(mdpTest, salt)).hashMdp;
        return hashMdpTest === mdpBDD;
    }

    static genererJWT(pseudo:string):string {
        const cle = fs.readFileSync("jwt-key", "utf-8");
        const token = jwt.sign({pseudo}, cle);
        return token;
    }

    static donneCookieJWT(pseudo:string):string {
        const token = this.genererJWT(pseudo);
        const date = new Date();
        date.setHours(date.getHours() + 4);
        const expire = date.toUTCString();
        const cookie = `${token}; expires=${expire}; secure; HttpOnly;`
        return cookie;
    }
}