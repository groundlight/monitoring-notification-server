enum PinState {
	HIGH = 1,
	LOW = 0,
}

type DetConfType = {
	vid_src: number;
	trigger_type: string;
	cycle_time?: number;
	pin?: number;
	pin_active_state?: PinState;
};

type DetType = {
	name: string;
	id: string;
	query: string;
	config: DetConfType;
};

type DetBaseType = {
	name: string;
	id: string;
	query: string;
	type: string;
	created_at: string;
	group_name: string;
	confidence_threshold: number;
};