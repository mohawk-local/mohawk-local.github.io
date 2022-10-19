var peer = new Peer();
var peer_conn

var messages = new Array();

var stage_select = document.getElementById("stages");
var vote_button = document.getElementById("vote");

var selected;
var result;

var first_stage;

var ready = false;

var is_picking_side = false;
var side_id = -1;

var is_voting = false;
var is_banning = true;
var is_stage_pick = false;

var timer;

var round_rules = [
		{
				tags: ["starter"],
				picks: [
						{picker: 0, is_ban: true},
						{picker: 1, is_ban: true},
						{picker: 1, is_ban: true},
						{picker: 0, is_ban: true}
				],
				character: -1,
		},
		{
				tags: ["starter", "counterpick"],
				picks: [
						{picker: 0, is_ban: true},
						{picker: 0, is_ban: true},
						{picker: 0, is_ban: true},
						{picker: 1, is_ban: false}
				],
				character: 0,
		},
		{
				tags: ["starter", "counterpick"],
				ban_first: true,
				picks: [
						{picker: 0, is_ban: true},
						{picker: 0, is_ban: true},
						{picker: 0, is_ban: true},
						{picker: 1, is_ban: false}
				],
				character: 0,
		}
];

const stages = {
		"battlefield": {"id": "battlefield", "name": "Battlefield", "tag": "starter"},
		"final_destination": {"id": "final_destination", "name": "Final Destination", "tag": "starter"},
		"town_and_city": {"id": "town_and_city", "name": "Town & City", "tag": "starter"},
		"pokemon_stadium_2": {"id": "pokemon_stadium_2", "name": "Pokémon Stadium 2", "tag": "starter"},
		"smashville": {"id": "smashville", "name": "Smashville", "tag": "starter"},
		"kalos_pokemon_league": {"id": "kalos_pokemon_league", "name": "Kalos Pokémon League", "tag": "counterpick"},
		"lylat_cruise": {"id": "lylat_cruise", "name": "Lylat Cruise", "tag": "counterpick"},
		"small_battlefield": {"id": "small_battlefield", "name": "Small Battlefield", "tag": "counterpick"},
		"yoshis_story": {"id": "yoshis_story", "name": "Yoshi's Story", "tag": "counterpick"}
};

peer.on('open', function(id) {
		console.log("Peer id:", id);
});

function add_stage(stage, element_id = "stage_select") {
		var img = document.createElement("img");
		img.src = "stages/" + stage.id + ".jpg";
		img.style.width = "250px";
		img.style.height = "140px";
		img.value = stage.id;
		document.getElementById(element_id).appendChild(img);
		img.addEventListener("click", function() {select(stage)});
}

function remove_stage(stage) {
		var options = Array.from(document.getElementById("stage_select").children);

		options
				.find(element => element.value == stage)
				.remove();
}

function clear_stages() {
		var node = document.getElementById("stage_select");

		while (node.firstChild) {
				node.removeChild(node.lastChild);
		}
}

function add_character(character, element_id = "character_select") {
		var img = document.createElement("img");
		img.src = "characters/" + character.id + ".png";
		img.style.width = "135px";
		img.style.height = "82px";
		img.value = character.id;
		document.getElementById(element_id).appendChild(img);
		img.addEventListener("click", function() {select(character)});
}

function remove_character(character) {
		var options = Array.from(document.getElementById("character_select").children);

		options
				.find(element => element.value == character)
				.remove();
}

function clear_characters() {
		var node = document.getElementById("character_select");

		while (node.firstChild) {
				node.removeChild(node.lastChild);
		}
}

function clear_results() {
		document.getElementById("results_panel").hidden = true;

		document.getElementById("stage_result_img").removeChild(document.getElementById("stage_result_img").childNodes[1]);
		document.getElementById("stage_result_text").textContent = "";

		document.getElementById("character_result_0_img").removeChild(document.getElementById("character_result_0_img").childNodes[1]);
		document.getElementById("character_result_0_text").textContent = "";

		document.getElementById("character_result_1_img").removeChild(document.getElementById("character_result_1_img").childNodes[1]);
		document.getElementById("character_result_1_text").textContent = "";
}

function start() {
		document.getElementById("host_menu").hidden = true;
		document.getElementById("join_menu").hidden = true;
		document.getElementById("logo").hidden = true;
		document.getElementById("title").hidden = true;
}

function ready_check() {
		ready = true;
		peer_conn.send("ready");
		document.getElementById("ready_button").hidden = true;
}

async function waitFor(f) {
		var sleep = ms => new Promise(r => setTimeout(r, ms));
		while (!f()) await sleep(1000);
		return f();
}

function receive_message(data) {
		console.log("Message received:", data);
		messages.push(data);
}

function set_voting(enabled = true, is_ban, is_stage) {
		is_voting = enabled;
		vote_button.disabled = !enabled;
		vote_button.hidden = !enabled;
		document.getElementById("selected").hidden = !enabled;

		vote_button.textContent = is_ban ? "BAN" : "PICK";

		document.getElementById("timer").hidden = false;

		if (enabled) {
				is_banning = is_ban;
				is_stage_pick = is_stage;

				timer = {
						timeleft: 30,
						interval: setInterval(function() {
								if (timer.timeleft >= 0) {
										document.getElementById("timer").textContent = new Date(1000 * timer.timeleft).toISOString().substr(14, 5);
										timer.timeleft -= 1;
								} else {
										clearInterval(timer.interval);
										vote(true);
								}
						}, 1000)
				};
		}
}

function select(choice) {
		selected = choice.id
		document.getElementById("selected").textContent = "Selected: " + choice.name;
}

function vote(force = false) {
		if (force & selected == undefined) {
				if (is_stage_pick) {
						var curr_stages = document.getElementById("stage_select").children
						selected = curr_stages[Math.floor(Math.random() * curr_stages.length)].value
				}
				else {
						var curr_chars = document.getElementById("character_select").children
						selected = curr_chars[Math.floor(Math.random * curr_stages.length)].value
				}
		}

		if (selected !== undefined) {
				set_voting(false, is_banning, is_stage_pick);

				peer_conn.send(selected);

				if (is_banning) {
						if (is_stage_pick) {
								remove_stage(selected);
						}
						else {
								remove_character(selected);
						}
				}
				else {
						result = selected;
				}

				clearInterval(timer.interval);
				document.getElementById("timer").hidden = true;
		}
}

function declare_side(side) {
		side_id = side;
		peer_conn.send(side);

		document.getElementById("declare_win").hidden = true;
		document.getElementById("declare_loss").hidden = true;
}

async function choose_sides() {
		side_id = -1;

		do {
				document.getElementById("declare_win").hidden = false;
				document.getElementById("declare_loss").hidden = false;

				await waitFor(() => side_id != -1);
				await waitFor(() => messages.length > 0);

				if (messages[0] == side_id) {
						alert("Both sides selected the same option! Try again.");
						side_id = -1;
				}

				messages.splice(0, 1);
		} while (side_id == -1)
}

async function run_round(round_id, picker_id) {
		clear_stages();
		clear_characters();

		for (const [key, value] of Object.entries(stages)) {
				if (round_rules[round_id].tags.includes(value.tag)) {
						add_stage(value);
				}
		}

		if ("ban_first" in round_rules[round_id] && round_rules[round_id].ban_first) {
				remove_stage(first_stage);
		}

		for (i in round_rules[round_id].picks) {
				if (round_rules[round_id].picks[i].picker == picker_id) {
						set_voting(true, round_rules[round_id].picks[i].is_ban, true);

						await waitFor(() => !is_voting);
				}
				else {
						await waitFor(() => messages.length > 0);

						if (round_rules[round_id].picks[i].is_ban) {
								remove_stage(messages[0]);
						}
						else {
								result = messages[0];
						}

						messages.splice(0, 1);
				}
		}

		if (result == undefined) {
				result = document.getElementById("stage_select").children[0].value;
		}

		if (round_id == 0) {
				first_stage = result;
		}

		clear_stages();

		document.getElementById("results_panel").hidden = false;
		document.getElementById("stage_result_text").textContent = stages[result].name;
		add_stage(stages[result], "stage_result_img");

		for (const [key, value] of Object.entries(characters)) {
				add_character(value);
		}

		if (round_rules[round_id].character == -1 || round_rules[round_id].character == side_id) {
				set_voting(true, false, false);
				await waitFor(() => !is_voting);

				document.getElementById("character_result_0_text").textContent = characters[result].name;
				add_character(characters[result], "character_result_0_img");

				await waitFor(() => messages.length > 0);

				document.getElementById("character_result_1_text").textContent = characters[messages[0]].name;
				add_character(characters[messages[0]], "character_result_1_img");
				messages.splice(0, 1);
		}
		else {
				await waitFor(() => messages.length > 0);

				document.getElementById("character_result_1_text").textContent = characters[messages[0]].name;
				add_character(characters[messages[0]], "character_result_1_img");
				messages.splice(0, 1);

				set_voting(true, false, false);
				await waitFor(() => !is_voting);

				document.getElementById("character_result_0_text").textContent = characters[result].name;
				add_character(characters[result], "character_result_0_img");
		}

		clear_characters();
}

async function host() {
		console.log("Started hosting");

		// Change to Stage Select Screen
		start();

		document.getElementById("header_text").textContent = "Waiting for connection..."
		document.getElementById("id_text").textContent = "Your ID is " + peer.id;

		// Wait for client
		var conn = await new Promise(function(resolve, reject) {
				peer.on('connection', function (conn) {
						console.log("Peer connected");
						peer_conn = conn
						resolve(conn)
				});
		});

		// Setup Message Queue
		conn.on('data', receive_message);

		document.getElementById("header_text").hidden = true;
		document.getElementById("id_text").hidden = true;

		// Wait for Self Ready
		document.getElementById("ready_button").hidden = false;
		await waitFor(() => ready);

		// Wait for Peer Ready
		await waitFor(() => messages.length > 0);
		messages.splice(0, 1);

		await run_round(0, 0);

		await choose_sides();

		// Wait for Self Ready
		ready = false;
		document.getElementById("ready_button").hidden = false;
		await waitFor(() => ready);

		// Wait for Peer Ready
		await waitFor(() => messages.length > 0);
		messages.splice(0, 1);

		clear_results();

		await run_round(1, side_id);

		await choose_sides();

		// Wait for Self Ready
		ready = false;
		document.getElementById("ready_button").hidden = false;
		await waitFor(() => ready);

		// Wait for Peer Ready
		await waitFor(() => messages.length > 0);
		messages.splice(0, 1);

		clear_results();

		await run_round(2, side_id);
}

async function join() {
		host_id = document.getElementById("connection_id").value.trim();

		var conn = peer.connect(host_id);
		peer_conn = conn
		
		// Setup Message Queue
		conn.on('data', receive_message);

		document.getElementById("header_text").hidden = true;
		document.getElementById("id_text").hidden = true;

		// Change to Stage Select Screen
		start();

		// Wait for Self Ready
		document.getElementById("ready_button").hidden = false;
		await waitFor(() => ready);

		// Wait for Peer Ready
		await waitFor(() => messages.length > 0);
		messages.splice(0, 1);

		await run_round(0, 1);
		
		await choose_sides();

		// Wait for Self Ready
		ready = false;
		document.getElementById("ready_button").hidden = false;
		await waitFor(() => ready);

		// Wait for Peer Ready
		await waitFor(() => messages.length > 0);
		messages.splice(0, 1);

		clear_results();

		await run_round(1, side_id);

		await choose_sides();

		// Wait for Self Ready
		ready = false;
		document.getElementById("ready_button").hidden = false;
		await waitFor(() => ready);

		// Wait for Peer Ready
		await waitFor(() => messages.length > 0);
		messages.splice(0, 1);

		clear_results();

		await run_round(2, side_id);
}


