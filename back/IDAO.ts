import DAOJSON from "./DAOJSON";
import {ObjectId} from "mongodb";
import DAOMongo from "./DAOMongo";

export default interface IDAO {
    creerUtilisateur(u:Utilisateur):Promise<boolean>;
    chargerUtilisateur(pseudo:string):Promise<Utilisateur|null>;
    // chargerTousUtilisateurs():Promise<Array<Utilisateur>>;
    verifierSiPseudoDisponible(pseudo:string):Promise<boolean>;
}

export function donneDAO():IDAO {
    return new DAOJSON();
}

export type Utilisateur = {
    _id?:ObjectId,
    pseudo: string,
    hashMdp: string,
    salt: string,
}