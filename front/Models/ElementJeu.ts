import GM from "../Objets/GM";
import {Position} from "../../Types";

export default abstract class ElementJeu<T extends ElementJeu<T>> {
    static map:Map<string, ElementJeu<any>> = new Map();
    static compteursIdsParNomClasse:Map<string, number> = new Map();
    gm:GM;
    nomClasse:string;
    id:string;
    div:HTMLDivElement;
    position:Position;
    rect!:DOMRect;
    scale:number = 1;

    abstract get mapClasse():Map<string, T>;

    constructor(gm:GM, nomClasse:string, id?:string, positionDepart?:Position) {
        this.gm = gm;
        this.nomClasse = nomClasse;
        let numId;

        if (!id) {
            if (!ElementJeu.compteursIdsParNomClasse.has(nomClasse)) {
                numId = 1;
            } else {
                numId = ElementJeu.compteursIdsParNomClasse.get(nomClasse)!;
            }
            ElementJeu.compteursIdsParNomClasse.set(nomClasse, numId + 1);
            this.id = `${nomClasse}${numId}`;
        } else {
            this.id = id;
        }
        this.div = document.createElement("div");
        this.div.classList.add(nomClasse);
        this.position = positionDepart ? positionDepart : gm.positionAleatoire();
        gm.main.append(this.div);
        gm.setPosition(this.div, this.position);
        this.rect = this.div.getBoundingClientRect();

        // this.updateRect();

        ElementJeu.map.set(this.id, this);
        this.ajouterDansMapClasse();
    }

    ajouterDansMapClasse() {
        this.mapClasse.set(this.id, <T><any>this);
    }

    supprimerDeMapClasse() {
        this.mapClasse.delete(this.id);
    }

    abstract onCollision():void;

    // updateRect() {
    //     window.requestAnimationFrame(()=>{
    //         this.rect = this.div.getBoundingClientRect();
    //     })
    // }

    supprimer() {
        this.div.remove();
        ElementJeu.map.delete(this.id);
        this.supprimerDeMapClasse();
    }
}