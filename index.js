const through = require("through2");
const inquirer = require("inquirer");
const semver = require("semver");

/**
 * Increment version file.
 */
module.exports = function ({
	prompt = false,
	level = "patch", // major, minor, patch, premajor, preminor, prepatch, or prerelease
	preid = null, // premajor, preminor, prepatch or prerelease
} = {}) {
	const parseBufferToObject = () => function (OriginalChunk) {
		OriginalChunk._contents = JSON.parse(OriginalChunk._contents);

		return Promise.resolve(OriginalChunk);
	};

	const contentToBuffer = () => function (currentChunk) {
		currentChunk._contents = new Buffer(JSON.stringify(currentChunk._contents, null, 2));
		return Promise.resolve(currentChunk);
	};

	const injectOptions = (prompt) =>
	(currentChunk) =>
	new Promise(function (resolve, reject) {
		let e;

		if (prompt) {
			inquirer.
			prompt([
				{
					type: "list",
					name: "level",
					message: `Choise the level to upgrade version`,
					choices: ["major", "minor", "patch", "premajor", "preminor", "prepatch", "prerelease"],
				},
				{
					type: "list",
					name: "preid",
					message: `Select the preid`,
					choices: ["auto", "premajor", "preminor", "prepatch", "prerelease"],
				}
			]).
			then(function (___opts_semver) {
				if (___opts_semver.preid === "auto") {
					___opts_semver.preid = null;
				};

				resolve(e = Object.assign(currentChunk, { ___opts_semver }));
			});
		} else {
			resolve(e = Object.assign(currentChunk, {
				___opts_semver: {
					level,
					preid,
				},
			}));
		}
	});

	const removeOptions = () => function (currentChunk) {
		delete currentChunk.___opts_semver;
		return Promise.resolve(currentChunk);
	};

	const upgradeVersionOfObject = () => function (currentChunk) {
		currentChunk._contents.version = semver.inc(currentChunk._contents.version, currentChunk.___opts_semver.level, currentChunk.___opts_semver.preid);

		return Promise.resolve(currentChunk);
	};

	return through.obj(function (chunk, enc, callback) {
		Promise.
		resolve(chunk).
		then(parseBufferToObject()).
		then(injectOptions(prompt)).
		then(upgradeVersionOfObject()).
		then(removeOptions()).
		then(contentToBuffer()).
		then((chunk) => callback(null, chunk)).
		catch(err => callback(err));
	});
};
