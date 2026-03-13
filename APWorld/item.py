from dataclasses import dataclass
from enum import Enum

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

@dataclass
class ItemType:
	type: ItemCategory
	sub_id: int
	name: str
	class_: ItemClassification
	
	id: int = 0

	def __post_init__(self):
		self.id = (self.type.value << 16) | self.sub_id

	def build(self, player):
		return FNNQItem(self.name, self.class_, self.id, player)
	
	def __str__(self):
		return self.name

item_types = [
	*(
		ItemType(ItemCategory.LEVEL, i|m, prefix + level, ItemClassification.progression)
		for i, level in enumerate(LEVELS)
		for m, prefix in ((256, '(Nuinui Quest) '), (512, '(Random Quest) '), (256|512, ''))
	),

	ItemType(ItemCategory.CHARACTER, 0, 'Flare', ItemClassification.progression),
	ItemType(ItemCategory.CHARACTER, 1, 'Noel', ItemClassification.progression_skip_balancing),
	
	*(
		ItemType(ItemCategory.FLARE_SHOT, i, name, ItemClassification.progression)
		for i, name in enumerate(SHOTS)
	),

	*(
		ItemType(ItemCategory.KEY, i, name + ' key', ItemClassification.progression)
		for i, name in enumerate(MYTH)
	),

	ItemType(ItemCategory.FLARE_ITEM, 1, 'Time Zone Clock', ItemClassification.progression),
	ItemType(ItemCategory.FLARE_ITEM, 2, "Elfriend's feathers", ItemClassification.progression),
	ItemType(ItemCategory.FLARE_ITEM, 4, "Angel's boots", ItemClassification.progression),

	*(
		ItemType(ItemCategory.HOLOX, i, name + "'s badge", ItemClassification.progression)
		for i, name in enumerate(('Iroha', 'Koyori', 'Chloe', 'Lui'))
	),
	ItemType(ItemCategory.HOLOX, 4, "La+'s badge", ItemClassification.filler),

	ItemType(ItemCategory.BIG_CRYSTAL, 1, 'big reaper crystal', ItemClassification.progression_skip_balancing),
	ItemType(ItemCategory.BIG_CRYSTAL, 2, 'big anchor crystal', ItemClassification.progression_skip_balancing),
	ItemType(ItemCategory.BIG_CRYSTAL, 3, 'big magatama crystal', ItemClassification.progression_skip_balancing),
	ItemType(ItemCategory.BIG_CRYSTAL, 4, 'big sword crystal', ItemClassification.progression_skip_balancing),

	ItemType(ItemCategory.IDOL_ESSENCE, 0, 'idol essence', ItemClassification.progression_deprioritized_skip_balancing),
	
	ItemType(ItemCategory.COIN, 0, 'gold coin', ItemClassification.filler),
	
	ItemType(ItemCategory.HEART, 0, 'heart', ItemClassification.filler),
	
	ItemType(ItemCategory.HELP, 0, 'help', ItemClassification.filler),
	
	ItemType(ItemCategory.NOUSAGI, 0, 'Nousagi', ItemClassification.filler),

	ItemType(ItemCategory.ALT_PALETTE, 0, 'colour palette swap', ItemClassification.trap),
	
	ItemType(ItemCategory.LEVEL_PROGRESSIVE, 0, 'progressive Nuinui Quest level', ItemClassification.progression),

	ItemType(ItemCategory.CASINO_KEY, 0, 'casino key', ItemClassification.progression),

	ItemType(ItemCategory.BOMB, 0, 'bomb', ItemClassification.filler),

	ItemType(ItemCategory.CRYSTALS, 1, 'crystal', ItemClassification.filler),
	*(
		ItemType(ItemCategory.CRYSTALS, i, '%d crystals' % i, ItemClassification.progression_deprioritized if i == 200 else ItemClassification.filler)
		for i in (2, 4, 8, 10, 12, 200)
	)
]

def get_item(x, require_valid=True):
	if isinstance(x, tuple):
		x = (x[0].value << 16) | x[1]
	elif isinstance(x, ItemCategory):
		x = x.value << 16
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
}
