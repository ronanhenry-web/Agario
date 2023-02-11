import IDAO, {Utilisateur} from "./IDAO";
import path from "path";
import * as fs from "fs";

export default class DAOJSON implements IDAO {
    private readonly cheminBDD = path.join(__dirname, "bdd.json");

    private chargerBDD():BDDJSON {
        if (!fs.existsSync(this.cheminBDD)) {
            fs.writeFileSync(this.cheminBDD, JSON.stringify({}));
        }
        const strBDD = fs.readFileSync(this.cheminBDD, "utf-8");
        if (!strBDD || strBDD === "") {
            return {};
        }
        try {
            const json = JSON.parse(strBDD);
            return <BDDJSON>json;
        } catch(e) {
            return {};
        }
    }

    private sauvegarderBDD(bdd:BDDJSON) {
        const json = JSON.stringify(bdd);
        fs.writeFileSync(this.cheminBDD, json);
    }

    async creerUtilisateur(u: Utilisateur): Promise<boolean> {
        const bdd = this.chargerBDD();
        bdd[u.pseudo] = u;
        this.sauvegarderBDD(bdd);
        return true;
    }

    async chargerUtilisateur(pseudo: string): Promise<Utilisateur | null> {
        const bdd = this.chargerBDD();
        return bdd[pseudo] ?? null;
    }

    async verifierSiPseudoDisponible(pseudo: string): Promise<boolean> {
        const bdd = this.chargerBDD();
        return bdd[pseudo] === undefined;
    }

}

type BDDJSON = {[pseudo:string]:Utilisateur};