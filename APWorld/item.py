from dataclasses import dataclass
from enum import Enum
from collections.abc import Callable

from BaseClasses import ItemClassification, Item

from .data import *

class FNNQItem(Item):
	game = GAME

class ItemCategory(Enum):
	CRYSTALS = 0
	LEVEL = 1
	LEVEL_MARINE = 2
	CHARACTER = 3
	FLARE_SHOT = 4
	KEY = 5
	FLARE_ITEM = 6
	HOLOX = 7
	BIG_CRYSTAL = 8
	IDOL_ESSENCE = 9
	COIN = 10
	HEART = 11
	HELP = 12
	NOUSAGI = 13
	ALT_PALETTE = 14
	LEVEL_PROGRESSIVE = 15
	CASINO_KEY = 16
	BOMB = 17
	DUAL_PISTOLS = 18
	ENEMY = 19

@dataclass
class ItemType:
	type: ItemCategory
	sub_id: int
	name: str
	class_: ItemClassification | Callable
	immediate: bool = False
	
	id: int = 0

	def __post_init__(self):
		self.id = (self.type.value << 8) | self.sub_id

	def build(self, world):
		return FNNQItem(self.name, self.class_ if isinstance(self.class_, ItemClassification) else self.class_(world), self.id, world.player)
	
	def __str__(self):
		return self.name

item_types = [
	*(
		ItemType(ItemCategory.LEVEL, i|m, prefix + level, ItemClassification.progression)
		for i, level in enumerate(LEVELS)
		for m, prefix in ((64, '(Nuinui Quest) '), (128, '(Random Quest) '), (64|128, ''))
	),

	*(
		ItemType(ItemCategory.LEVEL_MARINE, level, f'Stage {level:0>2}', ItemClassification.progression)
		for level in range(1, 29)
	),

	ItemType(ItemCategory.CHARACTER, 0, 'Flare', ItemClassification.progression),
	ItemType(ItemCategory.CHARACTER, 1, 'Progressive Noel', ItemClassification.progression_skip_balancing),
	ItemType(ItemCategory.CHARACTER, 3, 'Charged Mace', ItemClassification.progression),
	
	*(
		ItemType(ItemCategory.FLARE_SHOT, i, name, ItemClassification.progression)
		for i, name in enumerate(SHOTS)
	),

	*(
		ItemType(ItemCategory.KEY, i, name + ' Key', lambda world: ItemClassification.progression if world.options.nnq_goal.value > 1 or world.options.nnq_all_stages.value else ItemClassification.filler)
		for i, name in enumerate(MYTH)
	),

	ItemType(ItemCategory.FLARE_ITEM, 1, 'Time Zone Clock', ItemClassification.progression),
	ItemType(ItemCategory.FLARE_ITEM, 2, "Elfriend's Feathers", ItemClassification.progression),
	ItemType(ItemCategory.FLARE_ITEM, 4, "Angel's Boots", ItemClassification.progression),

	*(
		ItemType(ItemCategory.HOLOX, i, name + "'s Emblem", lambda world: ItemClassification.filler if getattr(world, 'characters', 0) == 2 else ItemClassification.progression)
		for i, name in enumerate(('Iroha', 'Koyori', 'Chloe', 'Lui'))
	),
	ItemType(ItemCategory.HOLOX, 4, "La+'s Emblem", ItemClassification.filler),

	ItemType(ItemCategory.BIG_CRYSTAL, 1, 'Big Reaper Crystal', lambda world: ItemClassification.filler if world.options.prq_goal.value else ItemClassification.progression_skip_balancing),
	ItemType(ItemCategory.BIG_CRYSTAL, 2, 'Big Anchor Crystal', lambda world: ItemClassification.filler if world.options.prq_goal.value else ItemClassification.progression_skip_balancing),
	ItemType(ItemCategory.BIG_CRYSTAL, 3, 'Big Magatama Crystal', lambda world: ItemClassification.filler if world.options.prq_goal.value else ItemClassification.progression_skip_balancing),
	ItemType(ItemCategory.BIG_CRYSTAL, 4, 'Big Sword Crystal', lambda world: ItemClassification.filler if world.options.prq_goal.value else ItemClassification.progression_skip_balancing),

	ItemType(ItemCategory.IDOL_ESSENCE, 0, 'Idol Essence', ItemClassification.progression_deprioritized_skip_balancing),
	
	ItemType(ItemCategory.COIN, 0, 'Gold Coin', ItemClassification.filler),
	
	ItemType(ItemCategory.HEART, 0, 'Heart', ItemClassification.filler, True),
	
	ItemType(ItemCategory.HELP, 0, 'Help', ItemClassification.filler),
	
	ItemType(ItemCategory.NOUSAGI, 0, 'Nousagi', ItemClassification.filler),

	ItemType(ItemCategory.ALT_PALETTE, 0, 'Colour Palette Swap', ItemClassification.trap, True),
	
	ItemType(ItemCategory.LEVEL_PROGRESSIVE, 0, 'Progressive Nuinui Quest Stage', ItemClassification.progression),
	ItemType(ItemCategory.LEVEL_PROGRESSIVE, 1, 'Progressive Maiden Quest Stage', ItemClassification.progression),

	ItemType(ItemCategory.CASINO_KEY, 0, 'Casino Key', ItemClassification.progression),

	ItemType(ItemCategory.BOMB, 0, 'Bomb', lambda world: ItemClassification.filler if world.logical_bomb and not getattr(world.multiworld, 'generation_is_fake', False) else setattr(world, 'logical_bomb', True) or ItemClassification.progression_deprioritized),

	ItemType(ItemCategory.DUAL_PISTOLS, 0, 'Dual Pistols', ItemClassification.progression | ItemClassification.useful),

	*(
		ItemType(ItemCategory.ENEMY, i, name, ItemClassification.trap, True)
		for i, name in enumerate(ENEMY_TRAPS)
	),

	ItemType(ItemCategory.CRYSTALS, 1, 'Crystal', ItemClassification.filler),
	*(
		ItemType(ItemCategory.CRYSTALS, i, '%d Crystals' % i, ItemClassification.progression_deprioritized if i == 200 else ItemClassification.filler)
		for i in (2, 4, 8, 10, 200)
	)
]

def get_item(x, require_valid=True):
	if isinstance(x, tuple):
		x = (x[0].value << 8) | x[1]
	elif isinstance(x, ItemCategory):
		x = x.value << 8
	try:
		if isinstance(x, int):
			return next(i for i in item_types if i.id == x)
		x = str(x)
		return next(i for i in item_types if i.name == x)
	except StopIteration:
		if require_valid:
			raise ValueError('%r is not a valid item' % x)
		return None

item_name_to_id = {
	i.name: i.id
	for i in item_types
	if i.id != 390
}
