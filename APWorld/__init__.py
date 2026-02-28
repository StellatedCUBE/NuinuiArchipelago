from worlds.AutoWorld import WebWorld, World
from BaseClasses import Tutorial, Region, ItemClassification
from Options import OptionError

from .data import GAME
from .options import FNNQOptions, fnnq_option_groups
from .item import item_name_to_id, get_item
from .location import location_name_to_id, get_location
from .nnq import nnq

class FNNQWebWorld(WebWorld):
	setup_en = Tutorial(
		tutorial_name = "Multiworld Setup Guide",
		description = "A guide to playing FLARE NUINUI QUEST with Archipelago.",
		language = "English",
		file_name = "setup_en.md",
		link = "setup/en",
		authors = ["StellatedCUBE"]
	)

	tutorials = [setup_en]
	game_info_languages = ["en"]
	rich_text_options_doc = True
	option_groups = fnnq_option_groups

class FNNQWorld(World):
	"""FLARE NUINUI QUEST is a Mega-Man-like action platformer in which you play as virtual YouTuber Shiranui Flare, among others."""

	game = GAME
	web = FNNQWebWorld()
	options_dataclass = FNNQOptions
	location_name_to_id = location_name_to_id
	item_name_to_id = item_name_to_id

	def add_item(self, item):
		self.items.append(get_item(item))

	def add_location(self, location, *a):
		self.locations.append((get_location(location), a))

	def add_goal_rule(self, goal):
		self.goals.append(goal)
	
	def add_goal_feat(self, feat):
		self.required_feats.add(feat)
	
	def place_item(self, location, item):
		self.locked_items[get_location(location).id] = item

	def create_region(self, name):
		region = Region(name, self.player, self.multiworld)
		self.multiworld.regions.append(region)
		return region

	def get_filler_item_name(self):
		filler_total_weight = sum(w for _, w in self.filler)
		i = self.random.randrange(filler_total_weight)
		for item, weight in self.filler:
			i -= weight
			if i < 0:
				return str(item)
		return 'heart'

	def create_item(self, name):
		return get_item(name).build(self.player)	

	def create_items(self):
		self.items = []
		self.locations = []
		self.goals = goals = []
		self.base_region = self.create_region(self.origin_region_name)
		self.potential_starting_levels = []
		self.filler = [(14 << 16, 1)]
		self.boss_data = dict()
		self.required_feats = set()
		self.locked_items = dict()

		player = self.player

		if self.options.nnq:
			nnq(self)

		if not any(get_item(item.name) in self.potential_starting_levels for item in self.multiworld.precollected_items[player]):
			starting_level = self.random.choice(self.potential_starting_levels)
			self.items.remove(starting_level)
			self.push_precollected(starting_level.build(player))

		self.filler = [(get_item(i), j) for i, j in self.filler]

		location_count = sum(location.id not in self.locked_items for location, _ in self.locations)

		while len(self.items) > location_count:
			filler = [item for item in self.items if item.class_ == ItemClassification.filler]
			if not filler:
				break
			self.items.remove(self.random.choice(filler))
		
		while len(self.items) > location_count:
			filler = [item for item in self.items if ItemClassification.progression not in item.class_]
			if not filler:
				raise OptionError('Not enough checks')
			self.items.remove(self.random.choice(filler))

		filler_total_weight = sum(w for _, w in self.filler)
		while len(self.items) < location_count:
			i = self.random.randrange(filler_total_weight)
			for item, weight in self.filler:
				i -= weight
				if i < 0:
					self.items.append(item)
					break

		self.random.shuffle(self.items)
		self.multiworld.itempool.extend(item.build(player) for item in self.items)
		for location, args in self.locations:
			built = location.build(player, *args)
			placed = self.locked_items.get(location.id)
			if placed:
				built.place_locked_item(self.create_item(placed))
		self.multiworld.completion_condition[player] = lambda state: all(goal(state, player) for goal in goals)
	
	def fill_slot_data(self):
		return dict(
			deathLink = self.options.death_link.value,
			boss = self.boss_data,
			goal = hex(sum(1 << feat for feat in self.required_feats))[2:],
			nnq_li = self.options.nnq_level_items.value,
		)
