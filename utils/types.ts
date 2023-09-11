enum PinState {
	HIGH = 1,
	LOW = 0,
}

type NotificationCondition = 'PASS' | 'FAIL';

type NotificationOptionsType = {
	condition: NotificationCondition;
	email?: {
		from_email: string;
		to_email: string;
		email_password: string;
		host: string;
	};
	twilio?: {
		account_sid: string;
		auth_token: string;
		from_number: string;
		to_number: string;
	};
	slack?: {
		token: string;
		channel_id: string;
	};
	stacklight?: {
		ip?: string;
		id?: string;
		ssid?: string;
		password?: string;
	};
};

type DetConfType = {
	enabled: boolean;
	imgsrc_idx: number;
	vid_config?: CameraConfigType;
	image: string;
	trigger_type: string;
	cycle_time?: number;
	pin?: number;
	pin_active_state?: PinState;
	notifications?: NotificationOptionsType;
};

type DetType = {
	name: string;
	id: string;
	query: string;
	config: DetConfType;
};

type DetExpType = DetType & {
    // index: number;
    delete: () => void;
    edit: (det: DetType) => void;
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

type CameraType = {
	image: string;
	config: CameraConfigType;
};

type CameraConfigType = {
	name: string;
	idx?: number;
	serial_number?: string | number;
	image_type?: string;
};
