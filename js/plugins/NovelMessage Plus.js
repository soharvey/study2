//=============================================================================
// NovelMessage Plus.js
//=============================================================================

/*:
 * @plugindesc Provides the full screen type message window.
 * @author Soulpour777, Yoji Ojima, Sasuke KANNAZUKI
 *
 * @param NVL Mode Switch
 * @desc The ID of the switch to determine novel mode.
 * @default 1
 *
 * @param Default ChoiceList X
 * @desc The default x coordinate of the choice list box before you change it.
 * @default 300
 *
 * @param Default ChoiceList Y
 * @desc The default y coordinate of the choice list box before you change it.
 * @default 312
 *
 * @help
 * Use control character '\F' to page break in novel mode.
 *
 
 Novel Message Plus
 Authors: Soulpour777, Yoji Ojima, Sasuke Kannazuki

 Plugin Commands:

 NVL : Placement : X : Y : W : H
    where: 
    X is the horizontal indention of the text
    Y is the vertical indention of the text
    W is the width of the message box
    H is the height of the message box

This would adjust the width and height, but this won't
support Word Wrapping. Please check my Word Wrapping
Plugin or check Yanfly's Message System for any word
wrapping feature.
 
 NVL : ChoiceList : X : Y
    where:
    X is the x coordinate of the choice box
    Y is the y coordinate of the choice box

Note:
    Default ChoiceList X and Default ChoiceList Y are eval values.
    It can take both Number and Code Values.

 */

var Imported = Imported || {};
Imported.SOUL_NVLMode = Imported.SOUL_NVLMode || {};

var Soul = Soul || {};
Soul.NVL_Mode = Soul.NLV_Mode || {};

var parametersNVL = PluginManager.parameters('NovelMessage Plus');

Soul.NVL_Mode.nvlSwitch = Number(parametersNVL['NVL Mode Switch']);
Soul.NVL_Mode.choiceListX = eval(parametersNVL['Default ChoiceList X']);
Soul.NVL_Mode.choiceListY = eval(parametersNVL['Default ChoiceList Y']);

(function() {

    Soul.NVL_Mode.Game_System_initialize = Game_System.prototype.initialize;
    Game_System.prototype.initialize = function() {
        Soul.NVL_Mode.Game_System_initialize.call(this);
        this._placementX = 0;
        this._placementY = 0;
        this._placementW = Graphics.width;
        this._placementH = Graphics.height;

        this._choiceListX = Soul.NVL_Mode.choiceListX;
        this._choiceListY = Soul.NVL_Mode.choiceListY;
    }

    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        // needs alias here

        switch(command) {
            case 'NVL': // NVL : Placement : X : Y : W : H
                if (args[0] === ':' && args[1] === 'Placement') {
                    if (args[2] === ':' && args[4] === ':' && args[6] === ':' && args[8] === ':') {
                        $gameSystem._placementX = Number(args[3]);
                        $gameSystem._placementY = Number(args[5]);
                        $gameSystem._placementW = Number(args[7]);
                        $gameSystem._placementH = Number(args[9]);
                    }
                }  // NVL : ChoiceList : X : Y
                if (args[0] === ':' && args[1] === 'ChoiceList') {
                    if (args[2] === ':' && args[4] === ':') {
                        $gameSystem._choiceListX = Number(args[3]);
                        $gameSystem._choiceListY = Number(args[5]);
                    }
                }
                break;
        }
    };


    function isNovelMode() {
        return $gameSwitches.value(Soul.NVL_Mode.nvlSwitch);
    };

    var _Window_Message_initMembers = Window_Message.prototype.initMembers;
    Window_Message.prototype.initMembers = function() {
        _Window_Message_initMembers.call(this);
        this._novelLineY = 0;
        this._novelNewPage = true;
    };

    var _Window_Message_updatePlacement =
            Window_Message.prototype.updatePlacement;
    Window_Message.prototype.updatePlacement = function() {
        if (!isNovelMode()) {
            this.width = this.windowWidth();
            this.height = this.windowHeight();
            this.x = (Graphics.boxWidth - this.width) / 2;
        }
        _Window_Message_updatePlacement.call(this);
        if (isNovelMode()) {
            this.move($gameSystem._placementX, $gameSystem._placementY, $gameSystem._placementW, $gameSystem._placementH);
        }
        if (this.contents.height !== this.contentsHeight()) {
            this.contents.resize(this.contentsWidth(), this.contentsHeight());
        }
    };

    var _Window_Message_updateBackground =
            Window_Message.prototype.updateBackground;
    Window_Message.prototype.updateBackground = function() {
        _Window_Message_updateBackground.call(this);
        if (isNovelMode()) {
            this.setBackgroundType(2);
        }
    };

    var _Window_Message_onEndOfText = Window_Message.prototype.onEndOfText;
    Window_Message.prototype.onEndOfText = function() {
        if (isNovelMode()) {
            this.processNewLine(this._textState);
        }
        _Window_Message_onEndOfText.call(this);
    };

    var _Window_Message_startMessage = Window_Message.prototype.startMessage;
    Window_Message.prototype.startMessage = function() {
        _Window_Message_startMessage.call(this);
        if (isNovelMode()) { 
            this._textState.y = this._novelLineY;
        }
    };

    var _Window_Message_newPage = Window_Message.prototype.newPage;
    Window_Message.prototype.newPage = function(textState) {
        if (!isNovelMode() || this._novelNewPage) {
            _Window_Message_newPage.call(this, textState);
            this._novelLineY = 0;
            this._novelNewPage = false;
        }
        if (isNovelMode()) {
            textState.x = this.newLineX();
            textState.left = this.newLineX();
            textState.height = this.calcTextHeight(textState, false);
            this._lineShowFast = false;
            this._pauseSkip = false;
            if (this.needsNewPage(textState)) {
                textState.y = this.contents.height;
                this._novelNewPage = true;
                this._textState.index--;
                this.startPause();
            }
        }
    };

    var _Window_Message_processNewLine = Window_Message.prototype.processNewLine;
    Window_Message.prototype.processNewLine = function(textState) {
        _Window_Message_processNewLine.call(this, textState);
        if (isNovelMode()) {
            this._novelLineY = this._textState.y;
        }
    };

    var _Window_Message_processEscapeCharacter =
            Window_Message.prototype.processEscapeCharacter;
    Window_Message.prototype.processEscapeCharacter = function(code, textState) {
        if (isNovelMode() && code === 'F') {
            textState.y = this.contents.height;
            this._novelNewPage = true;
            return;
        }
        _Window_Message_processEscapeCharacter.call(this, code, textState);
    };

    Soul.NVL_Mode.Window_ChoiceList_updatePlacement = Window_ChoiceList.prototype.updatePlacement;
    Window_ChoiceList.prototype.updatePlacement = function() {
        // I readressed this one because I think that you would want to see where your novel
        // choices are called.
        Soul.NVL_Mode.Window_ChoiceList_updatePlacement.call(this); // calling original method
        if (isNovelMode()) {
            this.x = $gameSystem._choiceListX;
            this.y = $gameSystem._choiceListY;
        }
    };

    var _Window_NumberInput_updatePlacement =
            Window_NumberInput.prototype.updatePlacement;
    Window_NumberInput.prototype.updatePlacement = function() {
        _Window_NumberInput_updatePlacement.call(this);
        if (isNovelMode()) {
            this.y = Graphics.boxHeight - this.height - 8;
        }
    };

    var _Window_NumberInput_buttonY =
            Window_NumberInput.prototype.buttonY;
    Window_NumberInput.prototype.buttonY = function() {
        if (isNovelMode()) {
            return 0 - this._buttons[0].height - 8;
        } else {
            return _Window_NumberInput_buttonY.call();
        }
    };



})();
