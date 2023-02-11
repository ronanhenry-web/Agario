import IDAO, {Utilisateur} from "./IDAO";
import {Db, MongoClient, ObjectId} from "mongodb";

export default class DAOMongo implements IDAO {
    connexion:MongoClient|null = null;
    donneBDD():Db {
        if (!this.connexion) {
            this.connexion = new MongoClient("mongodb://localhost:27017/");
        }
        const bdd = this.connexion.db("agarVinci");
        return bdd;
    }

    async creerUtilisateur(u: Utilisateur): Promise<boolean> {
        const collection = this.donneBDD().collection("utilisateurs");
        const retour = await collection.insertOne(u);
        return retour.acknowledged;
    }

    async chargerUtilisateur(pseudo: string): Promise<Utilisateur | null> {
        const collection = this.donneBDD().collection("utilisateurs");
        return <Utilisateur|null>await collection.findOne({pseudo});
    }

    async chargerTousUtilisateurs():Promise<Array<Utilisateur>> {
        const collection = this.donneBDD().collection("utilisateurs");
        return <Array<Utilisateur>>await collection.find().toArray();
    }

    async verifierSiPseudoDisponible(pseudo: string): Promise<boolean> {
        const utilisateur = await this.chargerUtilisateur(pseudo);
        return utilisateur === null;
    }
}