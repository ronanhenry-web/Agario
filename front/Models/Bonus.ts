import ElementJeu from "./ElementJeu";
import GM from "../Objets/GM";

export default class Bonus extends ElementJeu<Bonus> {
    static mapClasse:Map<string, Bonus> = new Map();
    static maxBonus = 50;

    get mapClasse() {
        return Bonus.mapClasse;
    }

    constructor(gm:GM) {
        super(gm, "bonus");

        if (Bonus.mapClasse.size > Bonus.maxBonus) {
            const bonusADelete = Array.from(Bonus.mapClasse.values())[0];
            bonusADelete.supprimer();
        }
    }

    onCollision() {
        this.supprimer();
        this.gm.joueur.agrandir(0.1);
    }
}