from worlds.AutoWorld import WebWorld, World
from BaseClasses import Tutorial, Region, ItemClassification, PlandoOptions
from Options import OptionError
from rule_builder.rules import CanReachRegion, True_

from .data import GAME, ENEMY_TRAPS
from .options import FNNQOptions, fnnq_option_groups
from .item import item_name_to_id, get_item, ItemCategory, FNNQItem
from .location import location_name_to_id, get_location, LocationCategory
from .nnq import nnq
from .prq import prq
from .mmq import mmq

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
	glitches_item_name = '_'

	def add_item(self, item):
		self.items.append(get_item(item))

	def add_location(self, location, *a):
		lo = get_location(location)
		cn = lo.flags.value & 3;
		if (cn & self.characters) == cn:
			self.locations.append((lo, a))

	def add_goal_location(self, *locations):
		self.goal_locations.extend(get_location(location).id for location in locations)
	
	def add_goal_feat(self, feat):
		self.required_feats.add(feat)
	
	def place_item(self, location, item):
		self.locked_items[get_location(location).id] = item

	def create_region(self, name):
		region = Region(name, self.player, self.multiworld)
		self.multiworld.regions.append(region)
		return region

	def get_filler_item_name(self):
		if self.random.random() * 20 < self.options.enemy_trap_intensity.value:
			return self.random.choice(ENEMY_TRAPS)
		filler_total_weight = sum(w for _, w in self.filler)
		i = self.random.randrange(filler_total_weight)
		for item, weight in self.filler:
			i -= weight
			if i < 0:
				return item.name
		return 'Heart'

	def create_item(self, name):
		return FNNQItem(name, ItemClassification.progression, None, self.player) if name == self.glitches_item_name else get_item(name).build(self)

	def generate_early(self):
		self.characters = 3 if self.options.nnq_other_character.value else 1 << self.options.nnq_starting_character.value
		match self.options.nnq.value + self.options.prq.value + self.options.mmq.value:
			case 0: raise OptionError('At least one quest must be enabled')
			case 1: self.single_quest = True
			case _: self.single_quest = False
		self.safety_nousagi = False
		self.warned_about_plando = False
		self.logical_bomb = False

	def create_items(self):
		self.base_region = self.create_region(self.origin_region_name)
		self.filler = [(ItemCategory.ALT_PALETTE, 1)]
		self.items = []
		self.locations = []
		self.goal_locations = []
		self.potential_starting_levels = []
		self.needs_starting_level = True
		self.boss_data = dict()
		self.required_feats = set()
		self.locked_items = dict()
		player = self.player

		if self.options.nnq: nnq(self)
		if self.options.prq: prq(self)
		if self.options.mmq: mmq(self)

		if self.needs_starting_level and not any(get_item(item.name) in self.potential_starting_levels for item in self.multiworld.precollected_items[player] if item.code):
			starting_level = self.random.choice(self.potential_starting_levels)
			self.items.remove(starting_level)
			self.push_precollected(starting_level.build(self))

		self.filler = [(get_item(i), j) for i, j in self.filler]
		self.filler_non_immediate = [f for f in self.filler if not f[0].immediate]

		location_count = sum(location.id not in self.locked_items for location, _ in self.locations) - self.safety_nousagi

		while len(self.items) > location_count:
			filler = [item for item in self.items if item.class_ == ItemClassification.filler]
			if not filler:
				break
			self.items.remove(self.random.choice(filler))
		
		while len(self.items) > location_count:
			filler = [item for item in self.items if ItemClassification.progression not in item.class_]
			if not filler:
				raise Exception('Not enough checks')
			self.items.remove(self.random.choice(filler))

		if self.safety_nousagi:
			location_count += 1
			if not any(item.type == ItemCategory.NOUSAGI for item in self.items):
				self.add_item(ItemCategory.NOUSAGI)

		while len(self.items) < location_count:
			self.add_item(self.get_filler_item_name())

		unrestricted_locations = 0
		for location, args in self.locations:
			placed = self.locked_items.get(location.id)
			if placed is None and location.id in self.locked_items:
				continue
			built = location.build(self, *args)
			if placed:
				built.place_locked_item(self.create_item(placed))
			else:
				unrestricted_locations += not(location.flags.value & 12)

		restricted_items = sum(item.immediate for item in self.items)

		if len(self.multiworld.worlds) == 1 and restricted_items > unrestricted_locations * 0.8:
			self.random.shuffle(self.items)
			filler_total_weight = sum(w for _, w in self.filler_non_immediate)
			for i in range(len(self.items)):
				if self.items[i].immediate:
					j = self.random.randrange(filler_total_weight)
					for item, weight in self.filler_non_immediate:
						j -= weight
						if j < 0:
							self.items[i] = item
							restricted_items -= 1
							break
					if restricted_items < unrestricted_locations * 0.8:
						break

		for item in self.items:
			built = item.build(self)
			self.multiworld.itempool.append(built)

		goal_rule = True_()
		for location, args in self.locations:
			if location.id in self.goal_locations:
				goal_rule &= CanReachRegion(args[0].name)
				if len(args) > 1 and args[1] is not None:
					goal_rule &= args[1]
		self.set_completion_rule(goal_rule)
	
	def fill_hook(self, _, __, pool, locations):
		try: location = self.get_location(get_location((LocationCategory.PACHINKO, 5)).name)
		except KeyError: return
		locations.remove(location)
		try: item = next(i for i in pool if i.classification == ItemClassification.trap and i.game != GAME)
		except StopIteration: item = next(i for i in pool if i.player == self.player and i.name == 'Nousagi')
		location.place_locked_item(item)
		pool.remove(item)
	
	def fill_slot_data(self):
		help_item = get_item(ItemCategory.HELP)
		return dict(
			deathLink = self.options.death_link.value,
			boss = self.boss_data,
			goal = hex(sum(1 << feat for feat in self.required_feats))[2:],
			nnq_li = self.options.nnq_stage_items.value,
			mr = self.options.randomise_music.value * self.random.randrange(1 << 31),
			oob = self.options.prq_allow_oob.value,
			help = +any(item == help_item for item in self.items),
			c = self.characters,
			et = self.options.enemy_trap_intensity.value,
		)
	
	def prevent_boss_plando(self):
		if not(getattr(self.multiworld, "generation_is_fake", False) or PlandoOptions.bosses & self.multiworld.plando_options):
			if not self.warned_about_plando:
				logging.warning(f"The plando bosses module is turned off, so {self.multiworld.player_names[self.player]}'s boss plando will be ignored.")
				self.warned_about_plando = True
			return True
