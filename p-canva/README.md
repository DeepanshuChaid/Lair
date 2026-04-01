### Understanding Canvas

1. how do we insert a layer ?
ans: so first set the canvasState ex: {mode: canvasMode.None} or {mode: CanvasMode.Inserting, layer: LayerType.Rectanlge} we can actually just use simple variable but it would be harder to maintain as typescript gives error directly but simple variables would not.

now about how we add layer first add three pointers up, down, move these refers to clicking and dragging and letting off the mouse left click. and add this to <svg> on click we set the startPoint basically x and y or coords of that point and on move we set draftLayer becuase our cursorMoving it is updating the draftLayer every milisecond. on up we can finally set the layer in our layer arrays and simply map that mf on the on svg LIKE A REAL TOP G 

2. What is <g> tag and how do we use it? when do we use it?
ans: <g> is like a div in svg world it works like giving a box to the element in svg. in ellipse it is not neccessary to give x and y to only g we can just give it to ellipse itself means we can give css styling to svg as well.

3. What is record<string, any> ?
ans: record is just a type in typescript that is used to store key-value pairs. it is like a dictionary or a hash map. it is used to store the layers in our canvas. it is used to store the layers in our canvas. <- my bad for this AI Confusing ahh defination it just means a object with string as id and that string holds the data why is this so usefull cuz it is easily mutable, addable, and deletable instead of using confusing array methods just to change one element. eg: - {id: "layer440", data: {Layer}}

4. Why was layers slipping in translation?
ans: So onPointerMove records are fasst like faster react is able to handle so when were moving the cursor it was adding more than it should because react would add to the x coordsinate 3 times in a row even before rendering. i know kind of confusing but its just means the pointer move is fast enough that react rendering engine is not fast enough for us to calc the offset. And thats why layer was slipping awaY.

SO how do we solve this well its simpler than it looks and feels we just capture the x and y of the layer on pointerDown and then we are dargging we calc the distance and add that distance to the layer. (NOTE :- WE ARE NOT SUPPOSED TO CHANGE THE COORDS OF THE MOUSE IN THE CANVASSTATE)

5. How do we add eraser to the board?
ans: first task is find if the cursor is on the layer or not and if it is then delete it. now it might seem like a hard thing to do but we are just wait i dont even need explain in sentence :- 

function FindLayerByPoint(x, y, layers) {
    //  we are minusing one because surprise if you forgot array consitutes of 0 too yk?
    //  we are just checking how many layers are there from the top to bottom and dont stop until we are at zero
    for (let i = layer.length() - 1; i >= 0; i --) {
        const layerObj = layers[i];
        // get the layer obj
        const layer = layerObj.layer;
        // get only the layer

        if (
            // if our mouse is on the right of the x like if it is more cuz yk x increse on the right decreases on the left
            x >= layer.x &&

            // and if it is between the left and right side of the layer
            x <= layer.x + layer.width &&

            // and if it is between the top and bottom side of the layer
            y >= layer.y &&
            y <= layer.y + layer.height
        ) {
            // so from our above logic we can conclude that he mouse in inside the layer so we return the id
            return layer.id 
        }
        if we conditions are not met return null
        return null
    }
} 

after this we just create a callback func for performance and filter and send the layer in websocket and just add this in add this in pointer down and move and yippe you got a working eraser thought it will not work on pencil cuz why should it?