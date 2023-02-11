import path from "path";
import GestionnaireWebSocket from "./GestionnaireWebSocket";
import {routeurUtilisateur} from "./RouteurUtilisateur";
import {Server} from "socket.io";

const http = require("http");
const express = require("express");

const App = express();

const SERVEUR_PORT = 58081;

App.use("/utilisateurs", routeurUtilisateur);

App.use("/", express.static(path.join(__dirname, "..", "front", "dist")));

const serveur = App.listen(SERVEUR_PORT);
console.log(`Serveur Express en écoute sur ${SERVEUR_PORT}`);

new GestionnaireWebSocket(serveur);

/*
const serveur = http.createServer(async (req:IncomingMessage, res:ServerResponse)=>{
    let reponse:ReponseRequete = {
        statusCode: 500,
        contentType: "text/plain",
        body: null,
    };

    if (req.url && req.url.split("/")[1] === "utilisateurs") {
        reponse = await traiterRequeteUtilisateur(req);
    } else {
        let requeteFichier = !req.url || req.url === "/" ? "/index.html" : req.url;
        requeteFichier = requeteFichier.substring(1);
        const cheminFichier = path.join(__dirname, "..", "front", "dist", requeteFichier);

        if (fs.existsSync(cheminFichier)) {
            reponse.statusCode = 200;
            reponse.contentType = mime.lookup(cheminFichier);
            const charset = mime.charset(reponse.contentType);
            reponse.body = fs.readFileSync(cheminFichier, charset !== false ? charset : undefined);
        } else {
            reponse.statusCode = 404;
            reponse.contentType = "text/html";
            reponse.body = "404 - non trouvé";
        }
    }

    res.statusCode = reponse.statusCode;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", reponse.contentType);
    if (reponse.cookie) {
        reponse.cookie.forEach(cookie=>{
            res.setHeader("Set-Cookie", cookie);
        });
    }
    res.end(reponse.body);
});

serveur.listen(SERVEUR_PORT);
console.log(`Serveur en écoute sur ${SERVEUR_PORT}`);
*/




export type ParametresRequete = {[p:string]:any};
export type ReponseRequete = {
    statusCode:number;
    contentType:string;
    body:string|Buffer|null;
    cookie?:Array<string>;
}
export function estReponseRequete(obj:any):obj is ReponseRequete {
    return typeof obj === "object" && obj.hasOwnProperty("statusCode") && obj.hasOwnProperty("contentType") && obj.hasOwnProperty("body");
}