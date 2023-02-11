import {Server} from "http";
import {Server as SocketIO, Socket} from "socket.io";
import {MessageInitServeur, UpdateJoueurSocket} from "../Types";

export default class GestionnaireWebSocket {
    private io:SocketIO;
    mapSocketsJoueurs:Map<string, Socket> = new Map();
    mapDerniereUpdateJoueurs:Map<string, UpdateJoueurSocket> = new Map();

    constructor(serveur:Server) {
        this.io = new SocketIO(serveur);
        this.definirEvenementsIO();
    }

    definirEvenementsIO() {
        this.io.on("connection", (socket:Socket)=>{
            socket.on("initJoueur", (messageInit:UpdateJoueurSocket)=>{
                const pseudo = messageInit.pseudo;

                /*
                On envois le message "initServeur" au joueur qui vient de se déconnecter,
                avec en paramètre un objet de type MessageInitServeur (Voir fichier Types.d.ts).
                */
                const messageInitServeur:MessageInitServeur = {
                    joueurs: {},
                };
                this.mapDerniereUpdateJoueurs.forEach((updateJoueur, pseudo)=>{
                    messageInitServeur.joueurs[pseudo] = updateJoueur;
                });
                socket.emit("initServeur", messageInitServeur);

                //On ajoute le joueur dans la map associées
                this.mapSocketsJoueurs.set(pseudo, socket);

                //On envois l'event "connexion" à tous les autres joueurs, en transmettant messageInit
                socket.broadcast.emit("connexion", messageInit);

                //Évenements socket.io à gérer :

                //"disconnect" -> Déconnexion d'un joueur
                socket.on("disconnect", ()=>{
                    socket.broadcast.emit("deconnexion", pseudo);
                });

                //"updateJoueur",
                socket.on("updateJoueur", (updateJoueur:UpdateJoueurSocket)=>{
                    socket.broadcast.emit("updateJoueur", updateJoueur);
                    this.mapDerniereUpdateJoueurs.set(updateJoueur.pseudo, updateJoueur);
                });

                //"miam",
                socket.on("gameover", pseudo=>{
                    socket.broadcast.emit("miam", pseudo);
                });

                //"gameover"
                socket.on("gameover", pseudo=>{
                    socket.broadcast.emit("gameover", pseudo);
                    this.supprimerJoueur(pseudo);
                });
            });
        });
    }

    supprimerJoueur(pseudo:string) {
        this.mapSocketsJoueurs.delete(pseudo);
        this.mapDerniereUpdateJoueurs.delete(pseudo);
    }
}