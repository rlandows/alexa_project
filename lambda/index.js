"use strict";
var APP_ID = undefined;  // TODO replace with your app ID (OPTIONAL).

var ANSWER_COUNT = 4; // The number of possible answers per trivia question.
var GAME_LENGTH = 5;  // The number of questions per trivia game.
var GAME_STATES = {
    TRIVIA: "_TRIVIAMODE", // Asking trivia questions.
    START: "_STARTMODE", // Entry point, start the game.
    HELP: "_HELPMODE" // The user is asking for help.
};
var questions = require("./questions");

//simpleAudio
var stateByUser = {};
var podcastURL = "https://p.scdn.co/mp3-preview/2385471a5d35709ad90e368dacabe4082af4541a?cid=null";

/**
 * When editing your questions pay attention to your punctuation. Make sure you use question marks or periods.
 * Make sure the first answer is the correct one. Set at least ANSWER_COUNT answers, any extras will be shuffled in.
 */
var languageString = {
    "en": {
        "translation": {
            "QUESTIONS" : questions["QUESTIONS_EN_US"],
            "GAME_NAME" : "Reindeer Trivia", // Be sure to change this for your skill.
            "HELP_MESSAGE": "I will ask you %s multiple choice questions. Respond with the number of the answer. " +
            "For example, say one, two, three, or four. To start a new game at any time, say, start game. ",
            "REPEAT_QUESTION_MESSAGE": "To repeat the last question, say, repeat. ",
            "ASK_MESSAGE_START": "Would you like to start playing?",
            "HELP_REPROMPT": "To give an answer to a question, respond with the number of the answer. ",
            "STOP_MESSAGE": "Would you like to keep playing?",
            "CANCEL_MESSAGE": "Ok, let\'s play again soon.",
            "NO_MESSAGE": "Ok, we\'ll play another time. Goodbye!",
            "TRIVIA_UNHANDLED": "Try saying a number between 1 and %s",
            "HELP_UNHANDLED": "Say yes to continue, or no to end the game.",
            "START_UNHANDLED": "Say start to start a new game.",
            "NEW_GAME_MESSAGE": "Welcome to %s. ",
            "WELCOME_MESSAGE": "I will ask you %s questions, try to get as many right as you can. " +
            "Just say the number of the answer. Let\'s begin. ",
            "ANSWER_CORRECT_MESSAGE": "correct. ",
            "ANSWER_WRONG_MESSAGE": "wrong. ",
            "CORRECT_ANSWER_MESSAGE": "The correct answer is %s. ",
            "ANSWER_IS_MESSAGE": "That answer is ",
            "TELL_QUESTION_MESSAGE": "Question %s. %s ",
            "GAME_OVER_MESSAGE": "You got %s out of %s questions correct. Thank you for playing!",
            "SCORE_IS_MESSAGE": "Your score is %s. "
        }
    },
    "en-US": {
        "translation": {
            "QUESTIONS" : questions["QUESTIONS_EN_US"],
            "GAME_NAME" : "American Reindeer Trivia" // Be sure to change this for your skill.
        }
    }

};

var Alexa = require("alexa-sdk");
var APP_ID = undefined;  // TODO replace with your app ID (OPTIONAL).

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.appId = APP_ID;
    // To enable string internationalization (i18n) features, set a resources object.
    //simpleAudio
    // var player = new SimplePlayer(event, context);
    // player.handle();
    alexa.resources = languageString;
    alexa.registerHandlers(newSessionHandlers, startStateHandlers, triviaStateHandlers, helpStateHandlers, SimplePlayer);
    alexa.execute();
};

var newSessionHandlers = {
    "LaunchRequest": function () {
        this.handler.state = GAME_STATES.START;
        SimplePlayer.prototype.play(audioURL, 0));
        this.emitWithState("StartGame", true);


    },
    "AMAZON.StartOverIntent": function() {
        this.handler.state = GAME_STATES.START;
        this.emitWithState("StartGame", true);
    },
    "AMAZON.HelpIntent": function() {
        this.handler.state = GAME_STATES.HELP;
        this.emitWithState("helpTheUser", true);
    },
    "Unhandled": function () {
        var speechOutput = this.t("START_UNHANDLED");
        this.emit(":ask", speechOutput, speechOutput);
    }
};

var startStateHandlers = Alexa.CreateStateHandler(GAME_STATES.START, {
    "StartGame": function (newGame) {
        var speechOutput = newGame ? this.t("NEW_GAME_MESSAGE", this.t("GAME_NAME")) + this.t("WELCOME_MESSAGE", GAME_LENGTH.toString()): "";
        // Select GAME_LENGTH questions for the game
        var translatedQuestions = this.t("QUESTIONS");
        var gameQuestions = populateGameQuestions(translatedQuestions);
        // Generate a random index for the correct answer, from 0 to 3
        var correctAnswerIndex = Math.floor(Math.random() * (ANSWER_COUNT));
        var correctAnswer = ANSWER_COUNT;
        var playSong = SimplePlayer.prototype.play(audioURL, 0);
        // Select and shuffle the answers for each question
        var roundAnswers = populateRoundAnswers(gameQuestions, 0, correctAnswerIndex, translatedQuestions);
        console.log("This is roundAnswers " + roundAnswers);
        console.log("And this is the right roundAnswer " + roundAnswers[correctAnswerIndex]);
        var currentQuestionIndex = 0;
        var spokenQuestion = Object.keys(translatedQuestions[gameQuestions[currentQuestionIndex]])[0];
        console.log("This is spokenQuestion " + spokenQuestion);
        var repromptText = this.t("TELL_QUESTION_MESSAGE", "1", spokenQuestion);

        // for (var i = 0; i < ANSWER_COUNT; i++) {
        //     repromptText += (i+1).toString() + ". " + roundAnswers[i] + ". ";
        //     console.log("This is a test" + roundAnswers[i]);
        // }

        speechOutput += repromptText;
        playSong;
        console.log("this is the song" playSong);
        Object.assign(this.attributes, {
            "speechOutput": repromptText,
            "repromptText": repromptText,
            "currentQuestionIndex": currentQuestionIndex,
            "correctAnswerIndex": correctAnswerIndex + 1,
            "questions": gameQuestions,
            "score": 0,
            "correctAnswerText": translatedQuestions[gameQuestions[currentQuestionIndex]][Object.keys(translatedQuestions[gameQuestions[currentQuestionIndex]])[0]][0]
        });

        // Set the current state to trivia mode. The skill will now use handlers defined in triviaStateHandlers
        this.handler.state = GAME_STATES.TRIVIA;
        this.emit(":askWithCard", speechOutput, repromptText, this.t("GAME_NAME"), repromptText);
    }
});

var triviaStateHandlers = Alexa.CreateStateHandler(GAME_STATES.TRIVIA, {
    "AnswerIntent": function () {
        handleUserGuess.call(this, false);

    },
    "DontKnowIntent": function () {
        handleUserGuess.call(this, true);
    },
    "AMAZON.StartOverIntent": function () {
        this.handler.state = GAME_STATES.START;
        this.emitWithState("StartGame", false);
    },
    "AMAZON.RepeatIntent": function () {
        this.emit(":ask", this.attributes["speechOutput"], this.attributes["repromptText"]);
    },
    "AMAZON.HelpIntent": function () {
        this.handler.state = GAME_STATES.HELP;
        this.emitWithState("helpTheUser", false);
    },
    "AMAZON.StopIntent": function () {
        this.handler.state = GAME_STATES.HELP;
        var speechOutput = this.t("STOP_MESSAGE");
        this.emit(":ask", speechOutput, speechOutput);
    },
    "AMAZON.CancelIntent": function () {
        this.emit(":tell", this.t("CANCEL_MESSAGE"));
    },
    "Unhandled": function () {
        var speechOutput = this.t("TRIVIA_UNHANDLED", ANSWER_COUNT.toString());
        this.emit(":ask", speechOutput, speechOutput);
    },
    "SessionEndedRequest": function () {
        console.log("Session ended in trivia state: " + this.event.request.reason);
    }
});

var helpStateHandlers = Alexa.CreateStateHandler(GAME_STATES.HELP, {
    "helpTheUser": function (newGame) {
        var askMessage = newGame ? this.t("ASK_MESSAGE_START") : this.t("REPEAT_QUESTION_MESSAGE") + this.t("STOP_MESSAGE");
        var speechOutput = this.t("HELP_MESSAGE", GAME_LENGTH) + askMessage;
        var repromptText = this.t("HELP_REPROMPT") + askMessage;
        this.emit(":ask", speechOutput, repromptText);
    },
    "AMAZON.StartOverIntent": function () {
        this.handler.state = GAME_STATES.START;
        this.emitWithState("StartGame", false);
    },
    "AMAZON.RepeatIntent": function () {
        var newGame = (this.attributes["speechOutput"] && this.attributes["repromptText"]) ? false : true;
        this.emitWithState("helpTheUser", newGame);
    },
    "AMAZON.HelpIntent": function() {
        var newGame = (this.attributes["speechOutput"] && this.attributes["repromptText"]) ? false : true;
        this.emitWithState("helpTheUser", newGame);
    },
    "AMAZON.YesIntent": function() {
        if (this.attributes["speechOutput"] && this.attributes["repromptText"]) {
            this.handler.state = GAME_STATES.TRIVIA;
            this.emitWithState("AMAZON.RepeatIntent");
        } else {
            this.handler.state = GAME_STATES.START;
            this.emitWithState("StartGame", false);
        }
    },
    "AMAZON.NoIntent": function() {
        var speechOutput = this.t("NO_MESSAGE");
        this.emit(":tell", speechOutput);
    },
    "AMAZON.StopIntent": function () {
        var speechOutput = this.t("STOP_MESSAGE");
        this.emit(":ask", speechOutput, speechOutput);
    },
    "AMAZON.CancelIntent": function () {
        this.emit(":tell", this.t("CANCEL_MESSAGE"));
    },
    "Unhandled": function () {
        var speechOutput = this.t("HELP_UNHANDLED");
        this.emit(":ask", speechOutput, speechOutput);
    },
    "SessionEndedRequest": function () {
        console.log("Session ended in help state: " + this.event.request.reason);
    }
});

function handleUserGuess(userGaveUp) {
    var answerSlotValid = isAnswerSlotValid(this.event.request.intent);
    console.log("This is in the handleUserGuess function " + isAnswerSlotValid(this.event.request.intent));
    console.log("Also in the handleuser function " + this.event.request.intent);
    console.log("3rd handleuser " + answerSlotValid);
    console.log(userGaveUp);
    var speechOutput = "";
    var speechOutputAnalysis = "";
    var gameQuestions = this.attributes.questions;
    var correctAnswerIndex = parseInt(this.attributes.correctAnswerIndex);
    var currentScore = parseInt(this.attributes.score);
    var currentQuestionIndex = parseInt(this.attributes.currentQuestionIndex);
    var correctAnswerText = this.attributes.correctAnswerText;
    var translatedQuestions = this.t("QUESTIONS");

    console.log('ANSWERSLOTVALID', answerSlotValid)
    console.log('THIS.ATTRIBUTES["CORRECTANSWERINDEX"]', this.attributes["correctAnswerIndex"])
    var answerObject = (this.event.request.intent.slots.Answer);
    if (answerSlotValid && answerObject.value == this.attributes["correctAnswerText"]) {

      console.log('CONDITION PASSED')
        currentScore++;

        speechOutputAnalysis = this.t("ANSWER_CORRECT_MESSAGE");
    } else {
        if (!userGaveUp) {
            speechOutputAnalysis = this.t("ANSWER_WRONG_MESSAGE");
        }

        speechOutputAnalysis += this.t("CORRECT_ANSWER_MESSAGE", correctAnswerText);
    }

    // Check if we can exit the game session after GAME_LENGTH questions (zero-indexed)
    if (this.attributes["currentQuestionIndex"] == GAME_LENGTH - 1) {
        speechOutput = userGaveUp ? "" : this.t("ANSWER_IS_MESSAGE");
        speechOutput += speechOutputAnalysis + this.t("GAME_OVER_MESSAGE", currentScore.toString(), GAME_LENGTH.toString());

        this.emit(":tell", speechOutput)
    } else {
        currentQuestionIndex += 1;
        correctAnswerIndex = Math.floor(Math.random() * (ANSWER_COUNT));
        var spokenQuestion = Object.keys(translatedQuestions[gameQuestions[currentQuestionIndex]])[0];
        var roundAnswers = populateRoundAnswers.call(this, gameQuestions, currentQuestionIndex, correctAnswerIndex, translatedQuestions);
        var questionIndexForSpeech = currentQuestionIndex + 1;
        var repromptText = this.t("TELL_QUESTION_MESSAGE", questionIndexForSpeech.toString(), spokenQuestion);

        // for (var i = 0; i < ANSWER_COUNT; i++) {
        //     repromptText += (i+1).toString() + ". " + roundAnswers[i] + ". "
        // }

        speechOutput += userGaveUp ? "" : this.t("ANSWER_IS_MESSAGE");
        speechOutput += speechOutputAnalysis + this.t("SCORE_IS_MESSAGE", currentScore.toString()) + repromptText;

        Object.assign(this.attributes, {
            "speechOutput": repromptText,
            "repromptText": repromptText,
            "currentQuestionIndex": currentQuestionIndex,
            "correctAnswerIndex": correctAnswerIndex + 1,
            "questions": gameQuestions,
            "score": currentScore,
            "correctAnswerText": translatedQuestions[gameQuestions[currentQuestionIndex]][Object.keys(translatedQuestions[gameQuestions[currentQuestionIndex]])[0]][0]
        });

        this.emit(":askWithCard", speechOutput, repromptText, this.t("GAME_NAME"), repromptText);
    }
}

function populateGameQuestions(translatedQuestions) {
    var gameQuestions = [];
    var indexList = [];
    var index = translatedQuestions.length;

    if (GAME_LENGTH > index){
        throw new Error("Invalid Game Length.");
    }

    for (var i = 0; i < translatedQuestions.length; i++){
        indexList.push(i);
    }

    // Pick GAME_LENGTH random questions from the list to ask the user, make sure there are no repeats.
    for (var j = 0; j < GAME_LENGTH; j++){
        var rand = Math.floor(Math.random() * index);
        index -= 1;

        var temp = indexList[index];
        indexList[index] = indexList[rand];
        indexList[rand] = temp;
        gameQuestions.push(indexList[index]);
    }

    return gameQuestions;
}

/**
 * Get the answers for a given question, and place the correct answer at the spot marked by the
 * correctAnswerTargetLocation variable. Note that you can have as many answers as you want but
 * only ANSWER_COUNT will be selected.
 * */
function populateRoundAnswers(gameQuestionIndexes, correctAnswerIndex, correctAnswerTargetLocation, translatedQuestions) {
    var answers = [];
    var answersCopy = translatedQuestions[gameQuestionIndexes[correctAnswerIndex]][Object.keys(translatedQuestions[gameQuestionIndexes[correctAnswerIndex]])[0]].slice();
    var index = answersCopy.length;

    if (index < ANSWER_COUNT) {
        throw new Error("Not enough answers for question.");
    }

    // Shuffle the answers, excluding the first element which is the correct answer.
    for (var j = 1; j < answersCopy.length; j++){
        var rand = Math.floor(Math.random() * (index - 1)) + 1;
        index -= 1;

        var temp = answersCopy[index];
        answersCopy[index] = answersCopy[rand];
        answersCopy[rand] = temp;
    }

    // Swap the correct answer into the target location
    for (var i = 0; i < ANSWER_COUNT; i++) {
        answers[i] = answersCopy[i];
    }
    temp = answers[0];
    answers[0] = answers[correctAnswerTargetLocation];
    answers[correctAnswerTargetLocation] = temp;
    return answers;
}

function isAnswerSlotValid(intent) {
    var answerSlotFilled = intent && intent.slots && intent.slots.Answer && intent.slots.Answer.value;
    console.log("answerSlotFilled is " + answerSlotFilled);

    console.log("Piece 1 " + intent);

    console.log("Piece 3" + intent.slots.Answer);
    console.log("Piece 4 " + intent.slots.Answer.value);
    return answerSlotFilled;
}

// The SimplePlayer has helpful routines for interacting with Alexa, within minimal overhead
var SimplePlayer = function (event, context) {
    this.event = event;
    this.context = context;
};

// Handles an incoming Alexa request
SimplePlayer.prototype.handle = function () {
    var requestType = this.event.request.type;
    var userId = this.event.context ? this.event.context.System.user.userId : this.event.session.user.userId;
    var response = null;

    // On launch, we tell the user what they can do (Play audio :-))
    if (requestType === "LaunchRequest") {
        // this.say("Welcome to the Simple Audio Player. Say Play to play some audio!", "You can say Play");
        this.play(podcastURL, 0);
    // Handle Intents here - Play, Pause and Resume is all for now
    } else if (requestType === "IntentRequest") {
        var intent = this.event.request.intent;
        if (intent.name === "Play") {
            this.play(podcastURL, 0);

        } else if (intent.name === "AMAZON.PauseIntent") {
            // When we receive a Pause Intent, we need to issue a stop directive
            //  Otherwise, it will resume playing - essentially, we are confirming the user's action
            this.stop();

        } else if (intent.name === "AMAZON.ResumeIntent") {
            var lastPlayed = this.load(userId);
            var offsetInMilliseconds = 0;
            if (lastPlayed !== null) {
                offsetInMilliseconds = lastPlayed.request.offsetInMilliseconds;
            }

            this.play(podcastURL, offsetInMilliseconds);
        }
    } else if (requestType === "AudioPlayer.PlaybackStopped") {
        // We save off the PlaybackStopped Intent, so we know what was last playing
        this.save(userId, this.event);

    }
};

/**
 * Creates a proper Alexa response using Text-To-Speech
 * @param message
 * @param repromptMessage
 */
SimplePlayer.prototype.say = function (message, repromptMessage) {
    var response = {
        version: "1.0",
        response: {
            shouldEndSession: false,
            outputSpeech: {
                type: "SSML",
                ssml: "<speak> " + message + " </speak>"
            },
            reprompt: {
                outputSpeech: {
                    type: "SSML",
                    ssml: "<speak> " + message + " </speak>"
                }
            }
        }
    }
    this.context.succeed(response);
};

/**
 * Plays a particular track, from specific offset
 * @param audioURL The URL to play
 * @param offsetInMilliseconds The point from which to play - we set this to something other than zero when resuming
 */
SimplePlayer.prototype.play = function (audioURL, offsetInMilliseconds) {
    var response = {
        version: "1.0",
        response: {
            shouldEndSession: true,
            directives: [
                {
                    type: "AudioPlayer.Play",
                    playBehavior: "REPLACE_ALL", // Setting to REPLACE_ALL means that this track will start playing immediately
                    audioItem: {
                        stream: {
                            url: audioURL,
                            token: "0", // Unique token for the track - needed when queueing multiple tracks
                            expectedPreviousToken: null, // The expected previous token - when using queues, ensures safety
                            offsetInMilliseconds: offsetInMilliseconds
                        }
                    }
                }
            ]
        }
    }

    this.context.succeed(response);
};

// Stops the playback of Audio
SimplePlayer.prototype.stop = function () {
    var response = {
        version: "1.0",
        response: {
            shouldEndSession: true,
            directives: [
                {
                    type: "AudioPlayer.Stop"
                }
            ]
        }
    }

    this.context.succeed(response);
};

// Saves information into our super simple, not-production-grade cache
SimplePlayer.prototype.save = function (userId, state) {
    console.log("Save: " + userId);
    stateByUser[userId] = state;
};

// Load information from our super simple, not-production-grade cache
SimplePlayer.prototype.load = function (userId) {
    console.log("Load: " + userId);
    var state = null;
    if (userId in stateByUser) {
        state = stateByUser[userId];
        console.log("Loaded " + userId + " State: " + state);
    }
    return state;
};