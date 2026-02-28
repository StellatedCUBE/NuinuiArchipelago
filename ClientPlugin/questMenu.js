export class APQuestMenu extends QuestMenu {
	constructor(game, prev) {
		super(game);
		this.questIdList = this.questIdList.filter(q => archipelagoState.availableLevels[q].size);
		this.questIndex = this.questIdList.indexOf(game.currentQuest);
		this.indexAnim = this.questIndex;
		this.quests = this.quests.filter(q => this.questIdList.includes(q.id));

		const superUpdate = this.update;
		this.update = game => {
			if (!prev)
				this.closeMenuBuffer = false;
			superUpdate(game);
			if (!game.menu) {
				if (this.confirmBuffer)
					archipelagoState.selectLevel(null);
				else
					game.menu = prev;
			}
		};
	}
}
