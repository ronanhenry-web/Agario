import IDAO, {donneDAO, Utilisateur} from "./IDAO";
import fs from "fs";
import jwt from "jsonwebtoken";
import {NextFunction, Request, Response} from "express";
import cookieParser = require("cookie-parser");
import {Auth} from "./Auth";

const express = require("express");
export const routeurUtilisateur = express.Router();

let dao:IDAO|null = null;

routeurUtilisateur.use(express.json());
routeurUtilisateur.use(cookieParser());

routeurUtilisateur.all("/*", (req:Request, res:Response, next:NextFunction)=>{
    if (!dao) {
        dao = donneDAO();
    }
    next();
});

routeurUtilisateur.get("/verifierSession", authentification, async (req:Request, res:Response)=>{
    console.log("verif session après authentif");
    console.log((<any>req).pseudo);
    res.send((<any>req).pseudo);
});

routeurUtilisateur.get("/deconnexion", async (req:Request, res:Response)=>{
    res.cookie("Auth", "false");
    res.sendStatus(200);
});

routeurUtilisateur.post("/inscription", async (req:Request, res:Response)=>{
    const {pseudo, mdp} = req.body;
    const pseudoEtMdpValides = validerPseudoEtMdp(pseudo, mdp);
    if (pseudoEtMdpValides !== true) {
        res.statusCode = 400;
        res.send(pseudoEtMdpValides);
        return;
    }
    if (!(await dao!.verifierSiPseudoDisponible(pseudo))) {
        res.statusCode = 400;
        res.send("Pseudo déjà pris");
    }
    const {hashMdp, salt} = Auth.hasherMdp(mdp, null);
    const utilisateur:Utilisateur = {
        pseudo,
        hashMdp,
        salt
    };
    await dao!.creerUtilisateur(utilisateur);
    res.cookie("Auth", Auth.donneCookieJWT(pseudo));
    res.sendStatus(200);
});

routeurUtilisateur.post("/connexion", async (req:Request, res:Response)=>{
    const {pseudo, mdp} = req.body;
    const pseudoEtMdpValides = validerPseudoEtMdp(pseudo, mdp);
    if (pseudoEtMdpValides !== true) {
        res.statusCode = 400;
        res.send(pseudoEtMdpValides);
        return;
    }
    const utilisateur = await dao!.chargerUtilisateur(pseudo);
    if (!utilisateur) {
        res.sendStatus(404);
        return;
    }

    if (Auth.comparerMotsDePasses(mdp, utilisateur.hashMdp, utilisateur.salt)) {
        //Connexion
        res.cookie("Auth", Auth.donneCookieJWT(pseudo));
        res.sendStatus(200);
        return;
    } else {
        res.sendStatus(401);
        return;
    }
});

//region "REST"
/*
routeurUtilisateur.get("/", (req:Request, res:Response)=>{

});
routeurUtilisateur.get("/:id", (req:Request, res:Response)=>{

});

routeurUtilisateur.post("/", (req:Request, res:Response)=>{

});
routeurUtilisateur.delete("/:id", (req:Request, res:Response)=>{

});
*/
//endregion "REST"

async function authentification(req:Request, res:Response, next:NextFunction) {
    if (!req.cookies.Auth) {
        res.sendStatus(401);
        return;
    }
    const match = req.cookies.Auth.match(/([^;]+)/);
    const token = match ? match[1] : null;
    if (!token) {
        res.sendStatus(401);
        return;
    }
    try {
        const cle = fs.readFileSync("jwt-key", "utf-8");
        const payload = jwt.verify(token, cle);
        const pseudo = (<any>payload).pseudo;
        const utilisateur = pseudo ? await dao!.chargerUtilisateur(pseudo) : null;
        if (utilisateur) {
            (<any>req).pseudo = pseudo;
            next();
            return;
        } else {
            res.sendStatus(401);
            return;
        }
    } catch(e) {
        res.sendStatus(401);
        return;
    }
}

function validerPseudoEtMdp(pseudo:any, mdp:any):true|string {
    if (!pseudo) {
        return "Paramètre pseudo absent";
    }
    if (typeof pseudo !== "string" || pseudo.length === 0) {
        return "Paramètre pseudo invalide";
    }
    if (!mdp) {
        return "Paramètre mdp absent";
    }
    if (typeof mdp !== "string") {
        return "Paramètre mdp invalide";
    }
    if (mdp.length < 8) {
        return "Paramètre mdp trop court";
    }
    return true;
}