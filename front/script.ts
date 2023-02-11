import GM from "./Objets/GM";

window.onload = async ()=>{
    let pseudo:string|null = null;
    const reponseVerifSession = await fetch("http://localhost:58081/utilisateurs/verifierSession");
    if (reponseVerifSession.status === 200) {
        pseudo = await reponseVerifSession.text();
    }

    if (!pseudo) {
        pseudo = await afficherPopupAuth();
    }

    const gm = new GM(pseudo);
    (<any>window).gm = gm;

    document.querySelector(".boutonDeconnexion")?.addEventListener("click", async ()=>{
        await fetch("http://localhost:58081/utilisateurs/deconnexion");
        document.location.reload();
    });
}

function afficherPopupAuth():Promise<string> {
    const promise:Promise<string> = new Promise(resolve=>{
        const popupAuth = document.createElement("div");
        popupAuth.classList.add("popupAuth");
        popupAuth.innerHTML = `
        <label for="inputPseudo">Pseudo</label>
        <input type="text" placeholder="Pseudo" id="inputPseudo">
        <label for="inputMdp">Mot de passe</label>
        <input type="text" placeholder="Mot de passe" id="inputMdp">
        <div class="divBoutons">
            <div class="boutonInscription">Inscription</div>
            <div class="boutonConnexion">Connexion</div>
        </div>
    `;
        popupAuth.querySelector(".boutonInscription")?.addEventListener("click", async ()=>{
            const pseudo = await inscription();
            if (!pseudo) {
                return;
            }
            popupAuth.remove();
            resolve(pseudo);
        });
        popupAuth.querySelector(".boutonConnexion")?.addEventListener("click", async ()=>{
            const pseudo = await connexion();
            if (!pseudo) {
                return;
            }
            popupAuth.remove();

            resolve(pseudo);
        });
        document.body.append(popupAuth);
    });
    return promise;
}

async function inscription():Promise<string|false> {
    const pseudoEtMdp = recupererPseudoMdp();
    if (!pseudoEtMdp) {
        return false;
    }
    const reponse = await fetch("http://localhost:58081/utilisateurs/inscription", {
        method: "POST",
        headers: {
            "Content-type":"application/json",
        },
        body: JSON.stringify(pseudoEtMdp),
    });
    if (reponse.status !== 200) {
        const erreur = await reponse.text();
        alert(erreur);
        return false;
    } else {
        return pseudoEtMdp.pseudo;
    }
}

async function connexion():Promise<string|false> {
    const pseudoEtMdp = recupererPseudoMdp();
    if (!pseudoEtMdp) {
        return false;
    }
    const json = JSON.stringify(pseudoEtMdp);
    const reponse = await fetch("http://localhost:58081/utilisateurs/connexion", {
        method: "POST",
        headers: {
            "Content-type":"application/json",
        },
        body: json,
    });
    if (reponse.status !== 200) {
        const erreur = await reponse.text();
        alert(erreur);
        return false;
    } else {
        return pseudoEtMdp.pseudo;
    }
}

function recupererPseudoMdp():{pseudo:string, mdp:string}|null {
    const pseudo = (<HTMLInputElement>document.querySelector("#inputPseudo"))?.value;
    const mdp = (<HTMLInputElement>document.querySelector("#inputMdp"))?.value;
    const pseudoValide = pseudo && typeof pseudo === "string" && pseudo.length > 0;
    const mdpValide = mdp && typeof mdp === "string" && mdp.length >= 8;
    if (!mdpValide && mdp && mdp.length < 8) {
        alert("Mdp trop faible");
        return null;
    } else if (pseudoValide && mdpValide) {
        return {pseudo, mdp};
    } else {
        return null;
    }
}