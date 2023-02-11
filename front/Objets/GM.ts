import Microbe from "../Models/Microbe";
import {MessageInitServeur, Position, UpdateJoueurSocket} from "../../Types";
import ElementJeu from "../Models/ElementJeu";
import Bonus from "../Models/Bonus";
import {io, Socket} from "socket.io-client";
import GestionnaireWebSocket from "./GestionnaireWebSocket";
require("../style.less");

export default class GM {
    static TICK = 60;

    game:boolean = true;
    private pause:boolean = false;

    main:HTMLElement;
    mainScale:number;
    private rectMain:DOMRect;

    sectionLogs:HTMLDivElement;

    joueur!:Microbe;

    gestionnaireSocket!:GestionnaireWebSocket;
    socket!:Socket;

    // private lastMoveTick:MouseEvent|null = null;
    private mousePosTickPrecedent:Position|null = null;
    private positionJoueurTickPrecedent:Position|null = null;
    private lastMove:MouseEvent|null = null;

    clavier = {
        up: false,
        down: false,
        left: false,
        right: false,
    };

    private compteurBonus = 0;
    private palierApparitionBonus = 30;

    static couleurRandom() {
        let couleur = Math.floor(Math.random()*16777215).toString(16);
        if (couleur.length < 6) {
            while (couleur.length < 6) {
                couleur += "0";
            }
        }
        return "#"+couleur;
    }

    constructor(pseudo:string) {
        this.main = document.querySelector("main")!;
        this.mainScale = parseFloat(getComputedStyle(this.main).getPropertyValue("--scale"));
        this.rectMain = this.main.getBoundingClientRect();

        this.sectionLogs = document.querySelector("section.logs")!;

        document.addEventListener("keydown", this.keyDown.bind(this));
        document.addEventListener("keyup", this.keyUp.bind(this));
        this.main.addEventListener("mousedown", this.mouseDown.bind(this));
        document.addEventListener("mouseup", this.mouseUp.bind(this));

        document.addEventListener("keyup", (e)=>{
            if (e.key === "Escape") {
                this.game = false;
            }
            if (e.key === " ") {
                this.pause = !this.pause;
            }
        });

        //this.init(this.recupererPseudo());
        this.init(pseudo);
    }

    recupererPseudo() {
        let pseudo:string|null = sessionStorage.getItem("pseudo");

        while (pseudo === null) {
            pseudo = prompt("Pseudo ?");
            if (!pseudo || pseudo.length === 0) {
                pseudo = null;
            }
        }

        sessionStorage.setItem("pseudo", pseudo);

        return pseudo;
    }

    async init(pseudo:string) {
        this.joueur = new Microbe(this, pseudo);
        this.joueur.div.id = "joueur";
        this.joueur.setCouleur("red");
        this.gestionnaireSocket = new GestionnaireWebSocket(this, pseudo, this.joueur.position);


        this.centrerViewportSurJoueur();

        for (let i = 0; i < 25; i++) {
            new Bonus(this);
        }

        this.tick();
    }

    setMainScale(scale:number) {
        requestAnimationFrame(()=> {
            this.mainScale = scale;
            if (this.mainScale < 1) {
                this.mainScale = 1;
            }
            this.main.style.setProperty("--scale", this.mainScale.toString());
            this.centrerViewportSurJoueur();
            window.setTimeout(() => {
                this.rectMain = this.main.getBoundingClientRect();
            }, 400);
        });
    }

    modifierMainScale(modificateur:number) {
        const newMainScale = this.mainScale *= modificateur;
        this.setMainScale(newMainScale);
    }

    reduireScale(retrait:number) {
        const newMainScale = this.mainScale - retrait;
        this.setMainScale(newMainScale);
    }

    tick() {
        requestAnimationFrame(()=>{
            if (!this.pause) {
                //Déplacer joueur
                const aBouge = this.tickMouvementJoueur();
                if (aBouge) {
                    this.centrerViewportSurJoueur();
                }
                //Déplacer autre joueurs
                Microbe.mapClasse.forEach((microbe)=>{
                    if (microbe.id === this.joueur.id) {
                        return;
                    }
                    if (microbe.debug) {
                        microbe.deplacerVersPosition(this.positionAleatoire());
                    } else {
                        this.setPosition(microbe.div, microbe.position);
                    }
                })
                //Checker collisions
                this.tickCheckerCollisions(aBouge );
                //Ajout bonus
                this.tickApparitionBonus();

                this.gestionnaireSocket.evenementFinTick();
            }
            if (this.game) {
                window.setTimeout(this.tick.bind(this), 1000 / GM.TICK);
            }
        });
    }

    tickMouvementJoueur():boolean {
        const mouvementClavier = this.clavier.up || this.clavier.down || this.clavier.left || this.clavier.right;
        if (!this.lastMove && !mouvementClavier) {
            return false;
        }

        if (mouvementClavier) {
            this.joueur.traiterMouvementClavier();
        }

        if (this.lastMove) {
            // const mousePosPX:Position = {
            //     x: (<any>this.lastMove).layerX * this.mainScale,
            //     y: (<any>this.lastMove).layerY * this.mainScale,
            // };
            const mousePosPX:Position = {
                x: (<any>this.lastMove).layerX,
                y: (<any>this.lastMove).layerY,
            };

            mousePosPX.x *= this.mainScale;
            mousePosPX.y *= this.mainScale;

            const mousePos:Position = this.positionPXVersPourcentages(mousePosPX);

            // const pasDeChangement = this.mousePosTickPrecedent && this.positionJoueurTickPrecedent && this.mousePosTickPrecedent.x === mousePos.x && this.mousePosTickPrecedent.y === mousePos.y;
            // if (pasDeChangement) {
            //     const multiplicateur = 2;
            //     let directionX = this.mousePosTickPrecedent!.x < this.positionJoueurTickPrecedent!.x ? 0 - multiplicateur : multiplicateur;
            //     let directionY = this.mousePosTickPrecedent!.y < this.positionJoueurTickPrecedent!.y ? 0 - multiplicateur : multiplicateur;
            //     mousePos.x *= directionX;
            //     mousePos.y *= directionY;
            // } else {
            //     this.mousePosTickPrecedent = {
            //         x: mousePos.x,
            //         y: mousePos.y
            //     };
            //     this.positionJoueurTickPrecedent = {
            //         x: this.joueur.position.x,
            //         y: this.joueur.position.y,
            //     };
            // }

            this.capperPosition(mousePos, null);
            this.joueur.deplacerVersPosition(mousePos);
        }

        return true;
    }

    tickCheckerCollisions(aBouge:boolean) {
        let mapElements = aBouge ? ElementJeu.map : Microbe.mapClasse;

        const keysElements = Array.from(mapElements.keys());
        for (let i = 0; i < keysElements.length; i++) {
            const id = keysElements[i];
            const element = mapElements.get(id);
            if (!element) {
                continue;
            }
            if (element.id === this.joueur.id) {
                continue;
            }

            const demiWidth = this.pxEnPourcentage(this.joueur.rect.width, true)/2;
            // const toucheX = element.position.x < this.joueur.position.x + demiWidth && element.position.x > this.joueur.position.x - demiWidth;
            // const demiHeight = this.pxEnPourcentage(this.joueur.rect.height, false)/2;
            // const toucheY = element.position.y < this.joueur.position.y + demiHeight && element.position.y > this.joueur.position.y - demiHeight;
            // if (toucheX && toucheY) {
            //     element.onCollision();
            // }

            const distanceX = this.joueur.position.x - element.position.x;
            const distanceY = this.joueur.position.y - element.position.y;

            const distance = Math.sqrt( distanceX*distanceX + distanceY*distanceY );

            if (distance < demiWidth) {
                element.onCollision();
            }


        }
    }

    tickApparitionBonus() {
        this.compteurBonus++;
        if (this.compteurBonus > this.palierApparitionBonus) {
            this.compteurBonus = 0;
            new Bonus(this);
        }
    }

    gameOver() {
        this.joueur.supprimer();
        this.game = false;
        const recommencer = confirm("Game over ! Recommencer ?");
        if (recommencer) {
            location.reload();
        }
    }

    setPosition(element:HTMLElement, position:Position) {
        // let xFinal = position.x - this.rectMain.x;
        // let yFinal = position.y - this.rectMain.y;
        let xFinal = position.x;
        let yFinal = position.y;
        // xFinal /= this.mainScale;
        // yFinal /= this.mainScale;
        element.style.setProperty("--x", `${xFinal.toString()}%`);
        element.style.setProperty("--y", `${yFinal.toString()}%`);
    }

    capperPosition(position:Position, element:ElementJeu<any>|null) {
        // const demiElement = element.rect.width/2;
        // if (position.x - demiElement < this.rectMain.left) {
        //     position.x = this.rectMain.left + demiElement;
        // } else if (position.x + demiElement > this.rectMain.right) {
        //     position.x = this.rectMain.right - demiElement;
        // }
        // if (position.y - demiElement < this.rectMain.top) {
        //     position.y = this.rectMain.top + demiElement;
        // } else if (position.y + demiElement> this.rectMain.bottom) {
        //     position.y = this.rectMain.bottom - demiElement;
        // }
        const demiWidth = element ? this.pxEnPourcentage(element.rect.width, true)/2 : 0;
        if (position.x - demiWidth < 0) {
            position.x = 0 + demiWidth;
        } else if (position.x + demiWidth > 100) {
            position.x = 100 - demiWidth;
        }

        const demiHeight = element ? this.pxEnPourcentage(element.rect.height, false)/2 : 0;
        if (position.y - demiHeight < 0) {
            position.y = 0 + demiHeight;
        } else if (position.y + demiHeight > 100) {
            position.y = 100 - demiHeight;
        }
    }

    mouseDown(e:MouseEvent) {
        document.addEventListener("mousemove", this.mouseMoveBind);
        this.lastMove = e;
    }

    mouseUp(e:MouseEvent) {
        document.removeEventListener("mousemove", this.mouseMoveBind);
        this.lastMove = null;
        this.mousePosTickPrecedent = null;
        this.positionJoueurTickPrecedent = null;
    }

    keyDown(e:KeyboardEvent) {
        if (e.key === "ArrowUp") {
            this.clavier.up = true;
        } else if (e.key === "ArrowDown") {
            this.clavier.down = true;
        } else if (e.key === "ArrowLeft") {
            this.clavier.left = true;
        } else if (e.key === "ArrowRight") {
            this.clavier.right = true;
        }
    }

    keyUp(e:KeyboardEvent) {
        if (e.key === "ArrowUp") {
            this.clavier.up = false;
        } else if (e.key === "ArrowDown") {
            this.clavier.down = false;
        } else if (e.key === "ArrowLeft") {
            this.clavier.left = false;
        } else if (e.key === "ArrowRight") {
            this.clavier.right = false;
        }
    }

    mouseMove = (e:MouseEvent)=>{
        this.lastMove = e;
    }
    mouseMoveBind = this.mouseMove.bind(this);

    positionAleatoire():Position {
        const positionPX = {
            x: Math.random() * (this.rectMain.right - this.rectMain.left) + this.rectMain.left,
            y: Math.random() * (this.rectMain.bottom - this.rectMain.top) + this.rectMain.top,
        };

        positionPX.x -= this.rectMain.x;
        positionPX.y -= this.rectMain.y;

        return this.positionPXVersPourcentages(positionPX);
    }

    positionPXVersPourcentages(positionPX:Position):Position {
        const positionPourcentages = {
            x: this.pxEnPourcentage(positionPX.x, true),
            y: this.pxEnPourcentage(positionPX.y, false),
        }

        return positionPourcentages;
    }

    pxEnPourcentage(px:number, estWidth:boolean) {
        return (100 * px) / (estWidth ? this.rectMain.width : this.rectMain.height);
    }

    ajouterMicrobeDebug(nombre:number = 1) {
        for (let i = 0; i < nombre; i++) {
            const microbe = new Microbe(this);
            microbe.debug = true;
        }
    }

    centrerViewportSurJoueur() {
        this.joueur.div.scrollIntoView({behavior: "smooth", block: "center", inline: "center"});
    }

    //region Gestion autres joueurs
    ajouterJoueur(updateJoueur:UpdateJoueurSocket) {
        new Microbe(this, updateJoueur.pseudo);
    }

    retirerJoueur(id:string) {
        const microbe = Microbe.mapClasse.get(id);
        if (microbe) {
            microbe.supprimer();
        }
    }
    //endregion Gestion autres joueurs
}