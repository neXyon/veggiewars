var VeggieWar = VeggieWar || {};

VeggieWar.Hand = function (player, left) {
    this.HAND_Y = 4;
    this.HAND_MOVE_SPEED = 2000;
    this.HAND_MOVE_TIME = 40;
    this.HAND_FLY_TIME = 100;

    this.GRAB_TIME = 3000;

    this.STATE_FOLLOW = 0;
    this.STATE_FLY = 1;
    this.STATE_GRAB = 2;

    this.player = player.player;
    this.game = player.game;
    this.mango = player;
    this.left = left;

    this.create();
}

VeggieWar.Hand.prototype = {
    setState: function(state) {
        this.state = state;
        this.elapsed = 0;
    },

    fly: function(direction) {
        if(this.state == this.STATE_FOLLOW && this.elapsed >= this.HAND_FLY_TIME) {
            this.setState(this.STATE_FLY);
            direction.normalize();
            this.hand.body.velocity.setTo(direction.x * this.HAND_MOVE_SPEED, direction.y * this.HAND_MOVE_SPEED);
            return true;
        }

        return false;
    },

    create: function() {
        this.setState(this.STATE_FOLLOW);
        this.player_x = this.mango.PLAYER_WIDTH;

        if(!this.left) {
            this.player_x = -this.mango.PLAYER_WIDTH;
        }

        this.hand = this.player.game.add.sprite(this.player.position.x + this.player_x, this.player.position.y + this.HAND_Y, 'hand');//, 0, this.player.group);
        this.hand.anchor.setTo(0.5, 0.5);
        this.game.physics.arcade.enable(this.hand);
        this.hand.body.allowRotation = false;

        if(!this.left) {
            this.hand.scale.x = -1;
        }
    },

    update: function() {
        this.elapsed += this.game.time.physicsElapsedMS;
        if(this.state == this.STATE_FOLLOW) {
            // hands follow player

            this.game.physics.arcade.moveToXY(this.hand, this.player.position.x + this.player_x, this.player.position.y + this.HAND_Y, this.HAND_MOVE_SPEED, this.HAND_MOVE_TIME);

            // warp player on the side of the screen

            if(this.player.position.x < this.mango.PLAYER_WIDTH) {
                this.hand.position.x += VeggieWar.SCREEN_WIDTH + VeggieWar.PLAYER_MAX_WIDTH;
            }

            if(this.player.position.x > VeggieWar.SCREEN_WIDTH + VeggieWar.PLAYER_MAX_WIDTH + this.mango.PLAYER_WIDTH) {
                this.hand.position.x -= VeggieWar.SCREEN_WIDTH + VeggieWar.PLAYER_MAX_WIDTH;
            }

            if(this.player.position.y < this.mango.PLAYER_WIDTH) {
                this.hand.position.y += VeggieWar.SCREEN_HEIGHT + VeggieWar.PLAYER_MAX_HEIGHT;
            }

            if(this.player.position.y > VeggieWar.SCREEN_HEIGHT + VeggieWar.PLAYER_MAX_HEIGHT + this.mango.PLAYER_WIDTH) {
                this.hand.position.y -= VeggieWar.SCREEN_HEIGHT + VeggieWar.PLAYER_MAX_HEIGHT;
            }
        }
        else if(this.state == this.STATE_FLY) {
            this.game.physics.arcade.overlap(this.hand, this.mango.veggie.platformLayer);

            var touching = this.hand.body.blocked;
            touching = touching.left || touching.right || touching.up || touching.down;

            if(touching) {
                if(this.mango.setOnRope(this.hand)) {
                    this.hand.body.velocity.set(0, 0);
                    this.setState(this.STATE_GRAB);
                }
                else {
                    this.hand.body.velocity.set(0, 0);
                    this.setState(this.STATE_FOLLOW);
                }
            }
            else if(this.elapsed >= this.HAND_FLY_TIME) {
                this.hand.body.velocity.set(0, 0);
                this.setState(this.STATE_FOLLOW);
            }
        }
        else if(this.state == this.STATE_GRAB) {
            if(this.elapsed >= this.GRAB_TIME) {
                this.setState(this.STATE_FOLLOW);
                this.mango.setOnRope(null);
            }
        }
    }
}

VeggieWar.Player = function (game) {
    this.game = game.game;
    this.veggie = game;
    this.GRAVITY = 400;
    this.PLAYER_WIDTH = VeggieWar.PLAYER_MAX_WIDTH / 2;
    this.PLAYER_MOVE_SPEED = 100;
    this.PLAYER_AIR_ACCELERATION = 100;
    this.PLAYER_JUMP_VELOCITY = 300;
    this.PLAYER_JUMP_SPEED_FACTOR = 1.4;
};

VeggieWar.Player.prototype = {
    setOnRope: function(hand) {
        if(hand != null) {
            if(this.on_rope != null)
                return false;

            this.on_rope = hand;

            this.player.body.velocity.setTo(0, 0);
            this.player.body.gravity.y = 0;

            this.rope_distance = Phaser.Point.distance(hand.position, this.player.position);
        }
        else {
            this.on_rope = null;

            this.player.body.gravity.y = this.GRAVITY;
            this.player.body.acceleration.setTo(0, 0);
        }
        return true;
    },

    fire: function(direction) {
        if(direction.x > 0) {
            if(!this.left_hand.fly(direction)){
                this.right_hand.fly(direction);
            }
        }
        else {
            if(!this.right_hand.fly(direction)){
                this.left_hand.fly(direction);
            }
        }
    },

    mouseDown: function() {
        var direction = new Phaser.Point(this.game.input.x  + this.game.camera.x - this.player.position.x, this.game.input.y + this.game.camera.y - this.player.position.y);

        this.fire(direction);
    },

    create: function () {
        //this.group = this.game.add.group();

        this.player = this.game.add.sprite(1024, 600, 'player');
        this.player.anchor.setTo(0.5, 0.5);

        this.left_hand = new VeggieWar.Hand(this, true);
        this.right_hand = new VeggieWar.Hand(this, false);

        this.game.physics.arcade.enable(this.player);
        this.player.body.gravity.y = this.GRAVITY;

        this.on_rope = null;

        this.rope_distance = 0;

        this.cursors = this.game.input.keyboard.createCursorKeys();
        this.game.input.onDown.add(this.mouseDown, this);

        this.move = {x: 0};
        this.movetween = null;
    },

    update: function() {
        this.game.physics.arcade.collide(this.player, this.veggie.platformLayer);

        var stop_move_tween = true;
        this.left_hand.follow_player = true;
        this.right_hand.follow_player = true;

        if(this.on_rope == null) {
            // ground movement
            if(this.player.body.onFloor()) {
                if(this.cursors.left.isDown) {
                    this.player.body.velocity.x = -this.PLAYER_MOVE_SPEED;
                    stop_move_tween = false;
                }
                else if(this.cursors.right.isDown) {
                    this.player.body.velocity.x = this.PLAYER_MOVE_SPEED;
                    stop_move_tween = false;
                }
                else {
                    this.player.body.velocity.x = 0;
                }

                if(this.cursors.up.isDown) {
                    stop_move_tween = true;
                    this.player.body.velocity.y = -this.PLAYER_JUMP_VELOCITY;
                    this.player.body.velocity.x *= this.PLAYER_JUMP_SPEED_FACTOR;
                }
            }
            // air movement
            else {
                if(this.cursors.left.isDown) {
                    this.player.body.velocity.x -= this.game.time.physicsElapsed * this.PLAYER_AIR_ACCELERATION;
                }
                else if(this.cursors.right.isDown) {
                    this.player.body.velocity.x += this.game.time.physicsElapsed * this.PLAYER_AIR_ACCELERATION;
                }
            }
        }
        // on rope!
        else {
            var player_accel = 0;

            if(this.cursors.left.isDown) {
                player_accel = -100;
            }
            else if(this.cursors.right.isDown) {
                player_accel = 100;
            }

            if(this.cursors.up.isDown) {
                if(this.rope_distance > 12) {
                    this.rope_distance -= this.game.time.physicsElapsed * 100;
                }
            }
            else if(this.cursors.down.isDown) {
                if(this.rope_distance < 200) {
                    this.rope_distance += this.game.time.physicsElapsed * 100;
                }
            }

            var d = Phaser.Point.subtract(this.player.position, this.on_rope.position);
            var dlength = d.getMagnitude();
            Phaser.Point.multiplyAdd(this.on_rope.position, d, this.rope_distance / dlength, this.player.position);

            if(d.x > 0) {
                d.perp();
            }
            else {
                d.rperp();
            }

            d.multiply(1 / dlength, 1 / dlength);
            dlength = d.y * this.GRAVITY;
            this.player.body.acceleration.setTo(dlength * d.x + player_accel, dlength * d.y);

            dlength = this.player.body.velocity.getMagnitude() * 0.999;

            if(this.player.body.velocity.dot(d) < 0) {
                d.multiply(-1, -1);
            }

            this.player.body.velocity.setTo(d.x * dlength, d.y * dlength);//*/
        }

        this.left_hand.update();
        this.right_hand.update();

        // warp player on the side of the screen

        if(this.player.position.x < this.PLAYER_WIDTH) {
            this.player.position.x += VeggieWar.SCREEN_WIDTH + VeggieWar.PLAYER_MAX_WIDTH;
        }

        if(this.player.position.x > VeggieWar.SCREEN_WIDTH + VeggieWar.PLAYER_MAX_WIDTH + this.PLAYER_WIDTH) {
            this.player.position.x -= VeggieWar.SCREEN_WIDTH + VeggieWar.PLAYER_MAX_WIDTH;
        }

        if(this.player.position.y < this.PLAYER_WIDTH) {
            this.player.position.y += VeggieWar.SCREEN_HEIGHT + VeggieWar.PLAYER_MAX_HEIGHT;
        }

        if(this.player.position.y > VeggieWar.SCREEN_HEIGHT + VeggieWar.PLAYER_MAX_HEIGHT + this.PLAYER_WIDTH) {
            this.player.position.y -= VeggieWar.SCREEN_HEIGHT + VeggieWar.PLAYER_MAX_HEIGHT;
        }

        // player rendering correction

        if(this.player.body.velocity.x < 0) {
            this.player.scale.x = 1;
            this.player.bringToTop();
            this.left_hand.hand.bringToTop();
        } else if(this.player.body.velocity.x > 0) {
            this.player.scale.x = -1;
            this.player.bringToTop();
            this.right_hand.hand.bringToTop();
        }

        // jumping of player while on ground and moving

        if(stop_move_tween) {
            if(this.movetween != null) {
                if(this.movetween.isRunning) {
                    this.movetween.repeatAll(0);
                }
                else {
                    this.movetween = null;
                }
            }
        }
        else {
            if(this.movetween == null) {
                this.movetween = this.game.add.tween(this.move).to({x: 5}, 100, Phaser.Easing.Quadratic.Out).to({x: 0}, 100, Phaser.Easing.Quadratic.In).repeatAll(-1).start();
            }
            else {
                this.movetween.repeatAll(-1);
            }
        }

        this.player.position.y += this.player.body.offset.y;
        this.player.body.offset.y = this.move.x;
        this.player.position.y -= this.move.x;
    }
}
