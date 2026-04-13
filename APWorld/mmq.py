from . import item
from . import location
from .data import ESSENCE, FEAT_MMQ_COIN

def mmq(world):
	p = world.player
	stage_item_extra_bits = 0 if world.single_quest else 256

	#excluded = {*world.options.excluded_locations.value}
	#for group in 

	for i in range(1, 29):
		region = world.create_region('mmq_%d' % i)
		world.base_region.connect(region, rule = 
			(lambda state, j=i: state.has(f'Stage {j:0>2}', p) or state.has(f'(Maiden Quest) Stage {j:0>2}', p) or state.has('progressive Maiden Quest stage', p, j))
			if i < 28 else
			(lambda state: state.has('Stage 28', p) or state.has('(Maiden Quest) Stage 28', p) or state.has('progressive Maiden Quest stage', p, 28) or state.has('idol essence', p, ESSENCE)))
		world.add_location((location.LocationCategory.COIN, i * 8), region)
		world.add_location((location.LocationCategory.COIN, i * 8 + 1 + 2 * world.options.mmq_coin_behaviour.value), region)
		world.add_location((location.LocationCategory.COIN, i * 8 + 2 + 2 * world.options.mmq_coin_behaviour.value), region)
		if world.options.mmq_stage_items and (i < 28 or world.options.mmq_goal.value):
			if world.options.mmq_stage_shuffle:
				world.add_item((item.ItemCategory.LEVEL_MARINE, i|stage_item_extra_bits))
				# HANDLE GROUPS
				if not all(location.name in world.options.exclude_locations for location, _ in world.locations[-3:]):
					world.potential_starting_levels.append(world.items[-1])
			else:
				world.add_item((item.ItemCategory.LEVEL_PROGRESSIVE, 1))
	
	if world.options.mmq_stage_items:
		if not world.options.mmq_stage_shuffle:
			world.potential_starting_levels.append(world.items[-1])
	else:
		world.needs_starting_level = False
		if world.options.mmq_stage_shuffle:
			levels = [*range(1, 28 + bool(world.options.mmq_goal.value))]
			world.random.shuffle(levels)
			world.push_precollected(world.create_item((item.ItemCategory.LEVEL_MARINE, levels[0]|stage_item_extra_bits)))
			for i in range(1, len(levels)):
				world.place_item((location.LocationCategory.COIN, levels[i - 1] * 8), (item.ItemCategory.LEVEL_MARINE, levels[i]|stage_item_extra_bits))
		else:
			world.push_precollected(world.create_item((item.ItemCategory.LEVEL_PROGRESSIVE, 1)))
			for i in range(1, 28 + bool(world.options.mmq_goal.value)):
				world.place_item((location.LocationCategory.COIN, i * 8), (item.ItemCategory.LEVEL_PROGRESSIVE, 1))
	
	if world.options.mmq_goal.value:
		world.filler.append((item.ItemCategory.COIN, 59))
	else:
		for i in range(ESSENCE):
			world.add_item(item.ItemCategory.IDOL_ESSENCE)
		world.filler.append((item.ItemCategory.IDOL_ESSENCE, 5))
		world.filler.append((item.ItemCategory.COIN, 54 - ESSENCE))
	
	match world.options.mmq_goal.value:
		case 0:
			world.add_goal_location('Maiden Quest stage 28 clear')
			world.add_goal_feat(FEAT_MMQ_COIN + 27 * 3)
		case 1:
			for i in range(1, 29):
				world.add_goal_location((location.LocationCategory.COIN, i * 8))
				world.add_goal_feat(FEAT_MMQ_COIN + i * 3 - 3)
		case 2:
			for i in range(3 * 28):
				world.add_goal_location(world.locations[-i-1][0])
				world.add_goal_feat(FEAT_MMQ_COIN + i)
