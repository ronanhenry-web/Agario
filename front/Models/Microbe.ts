import GM from "../Objets/GM";
import ElementJeu from "./ElementJeu";
import {Position} from "../../Types";

export default class Microbe extends ElementJeu<Microbe> {
    get pseudo() {
        return this.id;
    }
    static mapClasse:Map<string, Microbe> = new Map();
    readonly maxScale = 20;

    debug:boolean = false;

    private modificateurVitesse:number = 0.5;

    get mapClasse() {
        return Microbe.mapClasse;
    }

    constructor(gm:GM, id?:string, positionDepart?:Position) {
        super(gm, "microbe", id);
        this.div.style.setProperty("--nom", `"${id ?? this.id}"`);
        this.setCouleur(GM.couleurRandom());
    }

    setScale(nouvelleScale:number) {
        this.scale = nouvelleScale;
        if (this.scale > this.maxScale) {
            this.scale = this.maxScale;
        }
        this.div.style.setProperty("--scale", this.scale.toString());
        window.setTimeout(()=>{
            this.rect = this.div.getBoundingClientRect();
        }, 400);
    }

    agrandir(ajout:number) {
        const nouvelleScale = this.scale + ajout;
        this.setScale(nouvelleScale);

        this.gm.reduireScale(ajout/2);
        this.reduireVitesse(ajout/20);
    }

    reduireVitesse(retrait:number) {
        this.modificateurVitesse -= retrait;
        if (this.modificateurVitesse < 0.1) {
            this.modificateurVitesse = 0.1;
        }
    }

    onCollision() {
        if (this.scale > this.gm.joueur.scale) {
            this.gm.gestionnaireSocket.evenementMiam(this.gm.joueur.id);
            this.gm.gameOver();
        } else if (this.scale < this.gm.joueur.scale) {
            this.supprimer();
            this.gm.joueur.agrandir(this.scale/2);
            this.gm.gestionnaireSocket.evenementMiam(this.id);
        }
    }

    setCouleur(couleur:string) {
        this.div.style.setProperty("--couleur", couleur);
    }

    deplacerVersPosition(position:Position) {
        const direction:Position = {x: position.x - this.position.x, y:position.y - this.position.y};
        let magnitudeDirection = Math.sqrt(Math.pow(direction.x,2) + Math.pow(direction.y, 2));
        const unitVector = {x: direction.x / magnitudeDirection, y: direction.y / magnitudeDirection};

        const newPosition:Position = {
            x: this.position.x + unitVector.x * this.modificateurVitesse,
            y: this.position.y + unitVector.y * this.modificateurVitesse
        };

        if (Math.abs(newPosition.x - position.x) < 0.5 && Math.abs(newPosition.y - position.y) < 0.5) {
            return;
        }

        this.position = newPosition;

        this.gm.capperPosition(this.position, this);

        this.gm.setPosition(this.div, this.position);
    }

    traiterMouvementClavier() {
        if (this.gm.clavier.up) {
            this.position.y -= this.modificateurVitesse;
        } else if (this.gm.clavier.down) {
            this.position.y += this.modificateurVitesse;
        }

        if (this.gm.clavier.left) {
            this.position.x -= this.modificateurVitesse;
        } else if (this.gm.clavier.right) {
            this.position.x += this.modificateurVitesse;
        }

        this.gm.capperPosition(this.position, this);
        this.gm.setPosition(this.div, this.position);
    }
}