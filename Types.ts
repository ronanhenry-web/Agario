export type Position = {
    x:number,
    y:number,
};

export type UpdateJoueurSocket = {
    pseudo: string,
    taille: number,
    position:Position,
};

export type MessageInitServeur = {
    joueurs: {[pseudo:string]:UpdateJoueurSocket},
};
