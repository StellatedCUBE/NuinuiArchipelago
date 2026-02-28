export class ConsoleMenu extends Menu {
	wasB = false;

	constructor(prev = null) {
		super();
		this.previousMenu = prev;
		this.gc = document.getElementById('game-container');
		this.messages = Math.max(0, archipelagoState.chat.length - 2048);
		this.element = document.createElement('DIV');
		this.log = document.createElement('DIV');
		this.input = document.createElement('INPUT');

		this.element.style.fontFamily = NNM.game.assets.fonts.PixelMplus10;
		this.element.style.fontSize = '150%';
		this.element.style.position = 'absolute';
		this.element.style.height = '100vh';
		this.log.style.height = 'calc(100% - 1.25em)';
		this.log.style.overflowY = 'scroll';
		this.log.style.color = '#fff';
		this.log.style.whiteSpaceCollapse = 'preserve';
		this.log.style.paddingBottom = '0.25em';
		this.input.style.position = 'absolute';
		this.input.style.bottom = 0;
		this.input.style.width = '100%';
		this.input.style.fontFamily = NNM.game.assets.fonts.PixelMplus10;
		this.input.style.boxSizing = 'border-box';
		this.input.style.color = 'white';
		this.input.style.border = 'none';
		this.input.style.outline = 'none';
		this.input.style.fontSize = 'inherit';
		this.input.setAttribute('autocomplete', 'off');
		this.input.setAttribute('autocorrect', 'off');
		this.input.setAttribute('autocapitalize', 'off');
		this.input.setAttribute('spellcheck', 'false');

		this.element.appendChild(this.log);
		this.element.appendChild(this.input);
		document.body.appendChild(this.element);
		this.input.focus();

		this.input.addEventListener('keypress', e => {
			if (e.code === 'Enter') {
				const m = this.input.value.trim();
				this.input.value = '';
				if (m[0] === '/') {
					archipelagoState.chat.push(`${archipelagoState.client.players.self.name}: ${m}`.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
					const [cmd, a1, a2] = m.toLowerCase().split(' ');
					if (cmd === '/help')
						archipelagoState.chat.push(a1 ? '<span style="color:red">/help takes 0 arguments</span>' : '/help:\n    Display this text\n/deathlink [on|off]:\n    Enable or disable DeathLink')
					else if (cmd === '/deathlink') {
						if (!a1 || a2)
							archipelagoState.chat.push('<span style="color:red">/deathlink takes 1 argument</span>');
						else {
							const on = ['on', 'yes', 'true', 'y', '1', 't'].includes(a1);
							if (!on && !['off', 'no', 'false', 'n', '0', 'f'].includes(a1))
								archipelagoState.chat.push('<span style="color:red">/deathlink argument must be "on" or "off"</span>');
							else {
								archipelagoState.chat.push('DeathLink turned ' + (on ? 'on' : 'off'));
								archipelagoState.deathLink = on;
								archipelagoState.incomingDeath &= on;
								archipelagoState.client.storage.prepare(archipelagoState.keyPrefix + 'd', +on).replace(+on).commit();
							}
						}
					} else
						archipelagoState.chat.push(`<span style="color:red">Unknown command ${cmd}. Use /help to see a list of commands.</span>`);
				} else if (m)
					archipelagoState.client.messages.say(m);
			}
		})
	}

	drawOptions() {
		const rect = this.gc.getClientRects()[0];
		this.element.style.left = rect.x + 'px';
		this.element.style.width = rect.width + 'px';
		this.input.style.backgroundColor = document.activeElement === this.input ? '#226' : '#113';
	}

	update(game) {
		if ((document.activeElement !== this.input || InputManager.inputType !== 'keyboard') && this.wasB && !game.keys.b)
			return this.close();
		this.wasB = game.keys.b;
		const bottom = this.log.scrollTop + this.log.offsetHeight + 5 > this.log.scrollHeight;
		while (this.messages < archipelagoState.chat.length) {
			const element = document.createElement('DIV');
			element.innerHTML = archipelagoState.chat[this.messages++];
			this.log.appendChild(element);
			if (bottom && this.messages === archipelagoState.chat.length)
				this.log.scrollTop = this.log.scrollHeight;
		}
	}

	close() {
		NNM.game.menu = this.previousMenu;
		this.element.remove();
	}
}

document.addEventListener('keyup', e => {
	if (NNM.game.menu instanceof ConsoleMenu && e.key === 'Escape') {
		if (NNM.game.menu.input.value) NNM.game.menu.input.value = '';
		else NNM.game.menu.close();
	}
});
