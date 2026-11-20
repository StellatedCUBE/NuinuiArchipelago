from rule_builder.rules import Has, HasAll, HasAny

from . import item
from . import location
from . import data
from .arenas import prq_arenas
from .boss import allocate_bosses, Drop, Q_PRQ, Q_ALL
from .prq_enemy_data import prq_enemy_data

def prq(world):
	p = world.player

	crystals = []
	for i in range(1, 5):
		world.add_item((item.ItemCategory.BIG_CRYSTAL, i))
		crystals.append(world.items[-1].name)
	
	for i in range(5):
		world.add_item(item.ItemCategory.BOMB)
	
	shop = world.create_region('prq_shop')
	shop2 = world.create_region('prq_shop_2')
	if not world.single_quest or world.multiworld.players > 1:
		world.add_location((location.LocationCategory.SHOP, 0), shop)
		shop.connect(shop2, rule=HasAny(item.get_item((item.ItemCategory.CRYSTALS, 200)).name, item.get_item((item.ItemCategory.LEVEL, 1|128)).name, data.OOL_ITEM))
		world.add_location((location.LocationCategory.SHOP, 1), shop2)
		world.add_location((location.LocationCategory.SHOP, 2), shop2)
		for i in range(-3, 0):
			world.options.start_location_hints.value.add(world.locations[i][0].name)

	world.base_region.connect(shop, rule=Has(data.OOL_ITEM))

	world.add_item(200)

	bomb = item.get_item(item.ItemCategory.BOMB).name

	for i, level in enumerate(data.LEVELS[:6]):
		if i == 5:
			if world.options.prq_goal.value:
				world.add_item((item.ItemCategory.LEVEL, 128|i))
				world.add_location((location.LocationCategory.LEVEL_CLEAR_RANDOM, i), shop, Has(world.items[-1].name))
			else:
				world.add_location((location.LocationCategory.LEVEL_CLEAR_RANDOM, i), shop, HasAll(*crystals))
		else:
			if world.options.prq_goal.value:
				world.add_goal_feat(data.FEAT_PRQ_LEVEL_CLEAR + i)
			world.add_item((item.ItemCategory.LEVEL, 128|i))
			region = world.create_region('prq_' + level)
			if i in (0, 1, 3):
				world.potential_starting_levels.append(world.items[-1])
				source_region = world.base_region
				region.connect(shop)
			else:
				source_region = shop
			source_region.connect(region, rule = Has(world.items[-1].name))

			if i == 1:
				region2 = world.create_region('prq_casino2')
				region.connect(region2, rule = Has(item.get_item(item.ItemCategory.CASINO_KEY).name))
				if world.options.prq_casino_access:
					world.add_item(item.ItemCategory.CASINO_KEY)
				else:
					world.place_item((location.LocationCategory.BOSS_DROP, 23), item.ItemCategory.CASINO_KEY)

				if world.options.prq_casino_checks:
					world.filler.append((1, 2))
					world.filler.append((2, 2))
					world.filler.append((10, 1))
					#world.safety_nousagi = True
					for j in range(5):
						world.add_location((location.LocationCategory.PACHINKO, j), region)

			for j in range(1, 4):
				world.add_location((location.LocationCategory.NOUSAGI, i * 4 + j), region2 if i == 1 and j == 3 else region, (lambda state: state.has(bomb, p)) if (i, j) in ((1, 3), (3, 3)) else None)

			for l, type_, _, y in prq_enemy_data[i]:
				if world.options.prq_crystalsanity if type_ == 'crystal' else (world.options.prq_cratesanity if type_ == 'crate' else (world.options.prq_checkpointsanity if type_ == 'checkpoint' else world.options.prq_enemysanity)):
					world.add_location((location.LocationCategory.SANITY_RANDOM, l), region2 if i == 1 and y > 2 else region)
			
			world.add_location((location.LocationCategory.LEVEL_CLEAR_RANDOM, i), region2 if i == 1 else region)

		if i == 5 or world.options.prq_goal.value:
			world.add_goal_location(world.locations[-1][0])
			if world.single_quest and not world.options.prq_goal.value:
				world.place_item(world.locations[-1][0], None)
	
	world.add_goal_feat(data.FEAT_PRQ_LEVEL_CLEAR + 5)
	
	world.filler.append((item.ItemCategory.NOUSAGI, 15))

	if world.options.prq_crystalsanity:
		world.filler.append((8, sum(sum(type_ == 'crystal' for _, type_, _, _ in level) for level in prq_enemy_data)))
	
	if world.options.prq_cratesanity:
		world.filler.append((1, sum(sum(type_ == 'crate' for _, type_, _, _ in level) for level in prq_enemy_data)))
	
	if world.options.prq_enemysanity:
		c = sum(sum(type_ not in ('crate', 'crystal') for _, type_, _, _ in level) for level in prq_enemy_data) // 3
		world.filler.append((item.ItemCategory.HEART, c))
		world.filler.append((1, c))
		world.filler.append((2, c))

	arenas = prq_arenas()
	allocate_bosses(world, world.options.prq_boss_shuffle, arenas, Q_ALL if world.options.prq_boss_cross else Q_PRQ)
	for i, arena in enumerate(arenas):
		if arena.drop == Drop.ALWAYS or (world.options.prq_boss_all_drop and arena.drop != Drop.NEVER):
			world.add_location((location.LocationCategory.BOSS_DROP, i + 21), world.get_region(arena.region))
	
	world.boss_data['prq'] = [arena.boss.name for arena in arenas]
