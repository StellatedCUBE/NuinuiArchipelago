import * as AP from "./archipelago.js";
import { ArchipelagoState } from "./state.js";

const GAME = 'FLARE NUINUI QUEST';

let connectSettings = null;
let connectFail = null;

class ArchipelagoConnectMenu extends Menu {
	i = 0;
	focus = false;
	action = 0;
	page = 'Form';
	successTime = 0;

	constructor() {
		super();
		this.gc = document.getElementById('game-container');
		
		this.header = new LocaleElem(NNM.game, 'archipelago_connect_header', { textAlign: 'center' });
		this.connectButton = new LocaleElem(NNM.game, 'archipelago_connect');
		this.connectingMessage = new LocaleElem(NNM.game, 'archipelago_connecting', { textAlign: 'center' });
		this.errorHeader = new LocaleElem(NNM.game, 'archipelago_connect_error', { textAlign: 'center' });

		this.form = document.createElement('FORM');
		this.form.style.position = 'absolute';
		this.form.style.zIndex = 5;

		const df = NNM.game.config.getItem('archipelago') || ['localhost', '38281', 'StellatedNNQ', '']//['archipelago.gg', 38281, '', ''];
		this.fields = ['host', 'port', 'slot name', 'password'].map((field, i) => {
			const input = document.createElement('INPUT');
			this.form.appendChild(input);
			input.value = df[i];
			input.style.position = 'absolute';
			input.style.width = '120px';
			input.style.fontSize = '8px';
			input.style.fontFamily = NNM.game.assets.fonts.PixelMplus10;
			input.style.left = NNM.game.width * .5 - 68 + 'px';
			input.style.top = NNM.game.height * .4375 - 42.5 + i * 22 + 'px';
			input.style.color = 'white';
			input.style.background = 'none';
			input.style.border = 'none';
			input.style.outline = 'none';
			input.setAttribute('autocomplete', 'off');
			input.setAttribute('autocorrect', 'off');
			input.setAttribute('autocapitalize', 'off');
			input.setAttribute('spellcheck', 'false');
			if (field === 'password')
				input.style.webkitTextSecurity = 'square';

			input.addEventListener('keydown', e => {
				if (e.key === 'Escape') input.blur();
				else if (e.key === 'Enter') this.action = 1;
				else if (e.key === 'ArrowDown') this.action = 3;
				else if (e.key === 'ArrowUp') this.action = 2;
			});

			if (field === 'port') {
				input.addEventListener('beforeinput', e => {
					if (e.data && /[^0-9]/.test(e.data)) e.preventDefault();
				});
			}

			this[field.replace(' ', '')] = input;

			return {
				i,
				label: new TextElem(NNM.game, [...field], {lang: 'en'}),
				input
			};
		});

		this.formEnd = document.createElement('INPUT');
		this.formEnd.style.position = 'absolute';
		this.formEnd.style.left = '-200vw';
		this.form.appendChild(this.formEnd);
		
		document.body.appendChild(this.form);
		
		this.wasB = this.wasA = this.wasUp = this.wasDown = true;
	}

	draw = game => {
		const cx = game.ctx3;
		cx.save();
		this.drawBG(game, cx);
		this['draw' + this.page](game, cx);
		cx.restore();
	}

	drawBG(game, cx) {
		cx.clearRect(0, 0, game.width, game.height);
		cx.translate(game.width * .5, game.height * .4375);
		cx.globalAlpha = 1;
		
		cx.beginPath();
		cx.roundRect(-80, -70, 160, 140, 2);
		cx.strokeStyle = '#00003F';
		cx.lineWidth = 4;
		cx.stroke();
		cx.strokeStyle = '#FFF';
		cx.lineWidth = 2;
		cx.stroke();
		cx.fillStyle = '#000000E5';
		cx.fill();
	}

	drawForm(game, cx) {
		const gcr = this.gc.getClientRects()[0];
		this.form.style.top = gcr.y + 'px';
		this.form.style.left = gcr.x + 'px';
		this.form.style.transform = this.gc.style.transform;
		this.form.style.display = null;

		this.header.draw(game, cx, new Vector2(0, -67));

		cx.lineWidth = 1;
		cx.fillStyle = '#000';
		let y = -50;
		this.focus = false;
		for (const field of this.fields) {
			field.label.draw(game, cx, new Vector2(-77, y));

			if (field.input === document.activeElement) {
				cx.strokeStyle = '#7F7FFF';
				this.focus = true;
				if (this.i !== field.i) {
					this.i = field.i;
					game.playSound('menu');
				}
			} else {
				cx.strokeStyle = '#3F3FBF';
			}

			cx.beginPath();
			cx.roundRect(-67, y + 8, 120, 10, 1);
			cx.stroke();
			cx.fill();

			if (this.i === field.i)
				cx.drawImage(game.assets.images.ui_arrow, 0, 0, 8, 8, -75 - Math.floor(this.frameCount * .05) % 2, y + 9, 8, 8);

			y += 22;
		}

		if (this.formEnd === document.activeElement) {
			this.i = 4;
			this.formEnd.blur();
			game.playSound('menu');
		}

		if (this.i === 4)
			cx.drawImage(game.assets.images.ui_arrow, 0, 0, 8, 8, -75 - Math.floor(this.frameCount * .05) % 2, 48, 8, 8);

		this.connectButton.draw(game, cx, new Vector2(-67, 49));

		cx.restore();
	}

	drawConnecting(game, cx) {
		this.connectingMessage.draw(game, cx, new Vector2(0, this.connectingMessage.textElems[game.lang].height * -.5));
	}

	drawError(game, cx) {
		let y = (this.errorHeader.textElems[game.lang].height + this.errorMessage.length * 8 - 8) * -.5;
		for (const em of this.errorMessage) {
			em.draw(game, cx, new Vector2(0, y));
			y += em.height || 8;
		}
	}

	update = game => this['update' + this.page](game);

	updateForm(game) {
		if (this.focus) {
			if (/:/.test(this.host.value) && !/\[/.test(this.host.value)) {
				const cpos = this.host.value.indexOf(':');
				const port = +this.host.value.substr(cpos + 1);
				if (port) {
					this.port.value = port;
					this.port.focus();
				}
				this.host.value = this.host.value.substr(0, cpos);
			}

			if (/[^0-9]/.test(this.port.value))
				this.port.value = this.port.value.replace(/[^0-9]/g, '');

			if (InputManager.inputType === 'keyboard')
				this.wasB = this.wasA = this.wasUp = this.wasDown = true;
		}

		if (document.activeElement !== this.port) {
			if (+this.port.value < 1)
				this.port.value = '38281';

			else if (+this.port.value > 65535)
				this.port.value = '65535';
		}

		if (!this.focus || InputManager.inputType !== 'keyboard') {
			if (game.keys.a && !this.wasA) {
				game.playSound('select');
				if (this.i < 4)
					this.fields[this.i].input.focus();
				else
					this.startConnect();
			} else if (game.keys.b && !this.wasB) {
				if (this.focus)
					document.activeElement.blur();
				else
					this.close(game);
			} else if (game.keys.down && !this.wasDown) {
				this.action = 3;
			} else if (game.keys.up && !this.wasUp) {
				this.action = 2;
			}

			this.wasA = game.keys.a;
			this.wasB = game.keys.b;
			this.wasUp = game.keys.up;
			this.wasDown = game.keys.down;
		}

		switch (this.action) {
			case 1:
				game.playSound('select');
				if (this.i < 3)
					this.fields[++this.i].input.focus();
				else
					this.startConnect();
				break;

			case 2:
				document.activeElement.blur();
				game.playSound('menu');
				if (this.i)
					this.i--;
				else
					this.i = 4;
				break;

			case 3:
				document.activeElement.blur();
				game.playSound('menu');
				this.i = (this.i + 1) % 5;
				break;
		}

		this.action = 0;

		this.frameCount++;
	}

	updateConnecting(game) {
		this.wasB = this.wasA = this.wasUp = this.wasDown = true;

		if (this.successTime > 30) {
			this.close(game);
			archipelagoState.pendingPopUp = null;
			archipelagoState.bufferedHearts = 0;
			if (archipelagoState.availableLevelCount === 1) {
				for (const quest in archipelagoState.availableLevels) {
					if (archipelagoState.availableLevels[quest].size) {
						const level = [...archipelagoState.availableLevels[quest]][0];
						game.setQuest(quest);
						game.scene.update(game);
						if (level === game.currentStage) {
							game.scene.events[0].intro.event.next = game.scene.events[0].intro.event.started = true;
							if (quest === 'nuinui' && game.playerClass === Flare) {
								NNM.getPlayer().chargeTypeList = ['fire', 'rocket', 'petal', 'sword', 'shield', 'dual'].filter(x => archipelagoState.saves.nuinui[x]);
								if (!archipelagoState.feats && !archipelagoState.client.room.checkedLocations.length && !archipelagoState.saves.nuinui['item-noel'])
									archipelagoState.setSaveField('nuinui', 'item-gun', NNM.getPlayer().hasBow = false);
							}
						}
						else {
							game.setStage(level);
							game.scene.setFromMenu = quest !== 'nuinui';
						}
						return;
					}
				}
			}
			
			archipelagoState.selectQuest(null);
		}

		else if (connectFail) {
			this.page = 'Error';
			let txt = connectFail.toLowerCase();
			if (txt.startsWith('error:'))
				txt = txt.substr(6);
			txt = txt.trim();
			let cw = Infinity;
			const lines = [];
			for (const word of txt.split(' ')) {
				const tw = [...word].reduce((prev, curr) => prev + (FONT_EN[curr] || FONT_EN['?']).width, FONT_EN[' '].width);
				if (cw + tw > 150) {
					cw = 0;
					lines.push('');
				}
				lines[lines.length - 1] += word + ' ';
				cw += tw;
			}
			this.errorMessage = [this.errorHeader, ...lines.map(l => new TextElem(game, [...l.trimEnd()], { textAlign: 'center', lang: 'en' }))];
		}

		else if (self.archipelagoState?.availableLevelCount) {
			this.successTime++
		}
	}

	updateError(game) {
		if ((game.keys.a && !this.wasA) || (game.keys.b && !this.wasB)) {
			this.page = 'Form';
			game.playSound('select');
			connectFail = null;
		}

		this.wasA = game.keys.a;
		this.wasB = game.keys.b;
	}

	close(game) {
		this.form.remove();
		game.ctx3.clearRect(0, 0, game.width, game.height);
		game.menu = null;
	}

	startConnect() {
		this.form.style.display = 'none';
		this.page = 'Connecting';
		this.i = 4;
		NNM.game.config.setItem('archipelago', connectSettings = this.fields.map(field => field.input.value));
		createClient();
	}
}

class ArchipelagoOption extends NNM.MainMenuOption {
	key = 'archipelago';
	position = -4.5;

	onSelected() {
		NNM.game.menu = new ArchipelagoConnectMenu();
	}
}

NNM.MainMenuOption.custom.push(new ArchipelagoOption());

function createClient(forState) {
	connectFail = null;
	const archipelagoClient = new AP.Client();
	archipelagoClient.login(`${connectSettings[0]}:${connectSettings[1]}`, connectSettings[2], GAME, {
		password: connectSettings[3],
		tags: ['DeathLink'],
		slotData: !self.archipelagoState
	}).then(sd => {
		if (forState && forState !== self.archipelagoState)
			archipelagoClient.socket.disconnect();
		else if (self.archipelagoState)
			self.archipelagoState.use(archipelagoClient);
		else
			(self.archipelagoState = new ArchipelagoState(sd, createClient)).use(archipelagoClient);
	}).catch(e => {
		if (self.archipelagoState) {
			self.archipelagoState.reconnecting = false;
		} else {
			connectFail = ''+e;
		}
	});
}
