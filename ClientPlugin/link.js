import { xmlEsc } from './consoleMenu.js';

export class Link {
	#tag;
	#storageKey;
	#value;
	#lastGroup = '';
	#action;
	#sameSlot;

	constructor(pf, cmd, tag, action, sameSlot = true) {
		this.cmd = `/${cmd}link`;
		this.#tag = this.name = tag;
		this.#action = action;
		this.#sameSlot = sameSlot;
		archipelagoState.client.storage.fetch(this.#storageKey = pf + tag).then(v => this.be(v ?? archipelagoState.slotData[tag], 1));
	}

	be(value, noWrite) {
		if ('string' === typeof value)
			this.#lastGroup = this.#value = value;
		else
			this.#value = value ? this.#lastGroup : 0;
		if (!noWrite) {
			archipelagoState.updateTags();
			archipelagoState.client.storage.prepare(this.#storageKey, 0).replace(this.#value).commit();
			return this.name + ' is ' + (this.tag ? (this.#value ? xmlEsc(`on (Group ${JSON.stringify(this.#value)})`) : 'on (No group)') : 'off');
		} else this.ready = true;
	}

	get tag() {
		return 'string' === typeof this.#value && this.#tag + this.#value;
	}

	take(packet) {
		if (packet.tags?.includes(this.tag) && (this.#sameSlot ? packet.data.uuid !== NNM.game.config.getItem('archipelagoId') : packet.data.source !== archipelagoState.client.players.self.name)) {
			//console.log(`< ${this.tag} ${JSON.stringify(packet.data)}`);
			this.#action(packet.data);
		}
	}

	send(data) {
		if (this.tag) {
			data.uuid = NNM.game.config.getItem('archipelagoId');
			data.source = archipelagoState.client.players.self.name;
			data.time = 0|(Date.now() / 1e3);
			//console.log(`> ${this.tag} ${JSON.stringify(data)}`);
			try { archipelagoState.client.bounce({tags:[this.tag]}, data); }
			catch {}
		}
	}
}
