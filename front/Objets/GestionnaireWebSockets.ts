import {MessageInitServeur, Position, UpdateJoueurSocket} from "../../Types";
import {io, Socket} from "socket.io-client";
import Microbe from "../Models/Microbe";
import GM from "./GM";

export default class GestionnaireWebSocket {
    socket:Socket;
    private gm:GM;

    constructor(gm:GM, pseudo:string, positionDepart:Position) {
        this.gm = gm;
        console.log("Connexion socket");
        this.socket = io("http://localhost:58081");

        const messageInit:UpdateJoueurSocket = {
            pseudo: pseudo,
            taille: 1,
            position: positionDepart,
        }
        this.socket.emit("initJoueur", messageInit);

        this.declarerEvenementsSocket()
    }

    private declarerEvenementsSocket() {
        /*
        Méthodes et propriétés accessibles qui seront utiles :
        this.gm.ajouterJoueur(update:UpdateJoueurSocket);
        -> Ajout un joueur dans la partie et sur la map
        this.gm.retirerJoueur(id:string);
        -> Retire complètement un joueur de la partie et de la map
        this.gm.gameOver();
        -> Stoppe le jeu pour le joueur courant et propose de relancer

        Chaque joueur est représenté par une instance de la classe "Microbe"
        this.gm.joueur
        -> Permet de récupérer le microbe représentant le joueur actuel

        this.donneMicrobePourPseudo(pseudo)
        -> Permet de récupérer l'instance de Microbe représentant un joueur depuis son pseudo
        microbe.taille (number)
        -> Permet d'obtenir ou modifier la taille d'un microbe/joueur
        microbe.position (Position, voir dans Types.d.ts)
        -> Permet d'obtenir ou modifier la position d'un microbe/joueur

        this.ajouterLog(message)
        -> Permet d'afficher une nouvelle ligne dans la fenêtre "log" de la partie
         */


        //Évènements à gérer :

        /*
        "initServeur"
        -> Le serveur envoi un objet de type MessageInitServeur, qui contient la liste des joueurs déjà présents en début de partie
        -> Ajouter tous les joueurs dans la partie
        */
        this.socket.on("initServeur", (messageInit:MessageInitServeur)=>{
            for (let cle in messageInit.joueurs) {
                const updateJoueur = messageInit.joueurs[cle];
                this.gm.ajouterJoueur(updateJoueur);
            }
        });

        /*
        "connexion"
        -> Le serveur envoi un objet de type UpdateJoueurSocket
        -> Un nouveau joueur vient de se connecter
        -> Afficher un message dans les logs, ajouter le joueur dans la partie
        */
        this.socket.on("connexion", (updateJoueur:UpdateJoueurSocket)=>{
            this.gm.ajouterJoueur(updateJoueur);
            this.ajouterLog(`${updateJoueur.pseudo} vient de se connecter`);
        });

        /*
        "deconnexion"
        -> Le serveur envoi une string correspondant au pseudo du joueur déconnecté
        -> On le log, et on retire le joueur de la partie
        */
        this.socket.on("deconnexion", (pseudo:string)=>{
            this.gm.retirerJoueur(pseudo);
            this.ajouterLog(`${pseudo} vient de déconnecter`);
        });

        /*
        "updateJoueur"
        -> Le serveur envoi un objet de type UpdateJoueurSocket
        -> On récupère le microbe associé au joueur, on update sa taille si besoin et sa position.
        */
        this.socket.on("updateJoueur", (updateJoueur:UpdateJoueurSocket)=>{
            const microbe = this.donneMicrobePourPseudo(updateJoueur.pseudo);
            if (!microbe) {
                return;
            }
            microbe.setScale(updateJoueur.taille);
            microbe.position = updateJoueur.position;
        });

        /*
        "gameover"
        -> Le serveur envoi le pseudo du joueur ayant perdu
        -> Si il s'agit du joueur courant, on termine la partie
        -> On retire le joueur de la partie
        -> On l'indique dans les logs
        */
        this.socket.on("gameover", pseudo=>{
            if (pseudo === this.gm.joueur.pseudo) {
                this.gm.gameOver();
                return;
            }
            this.gm.retirerJoueur(pseudo);
            this.ajouterLog(`${pseudo} vient de se faire bouffer`);
        });

        //Compléter également les méthodes this.evenementMiam() et this.evenementFinTick()
    }

    donneMicrobePourPseudo(pseudo:string):Microbe|null {
        return Microbe.mapClasse.get(pseudo) ?? null;
    }

    evenementMiam(pseudoJoueurMange:string) {
        /*
        -> Le joueur courant vient d'en bouffer un autre, on envois l'event "miam" au serveur
        -> avec le pseudo du joueur digéré
         */
        this.socket.emit("miam", pseudoJoueurMange);
    }

    evenementFinTick() {
        /*
       -> Une boucle de jeu se termine, on envois un objet UpdateJoueurSocket au serveur
       -> pour qu'il transmette la position et la taille du joueur courant aux autres joueurs.
        */
        const updateJoueur:UpdateJoueurSocket = {
            pseudo: this.gm.joueur.pseudo,
            taille: this.gm.joueur.scale,
            position: this.gm.joueur.position,
        };
        this.socket.emit("updateJoueur", updateJoueur);
    }

    ajouterLog(message:string) {
        const div = document.createElement("div");
        div.innerText = message;
        this.gm.sectionLogs.append(div);
        div.scrollIntoView();
    }
}