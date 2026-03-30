### Understanding Canvas

1. how do we insert a layer ?
ans: so first set the canvasState ex: {mode: canvasMode.None} or {mode: CanvasMode.Inserting, layer: LayerType.Rectanlge} we can actually just use simple variable but it would be harder to maintain as typescript gives error directly but simple variables would not.

now about how we add layer first add three pointers up, down, move these refers to clicking and dragging and letting off the mouse left click. and add this to <svg> on click we set the startPoint basically x and y or coords of that point and on move we set draftLayer becuase our cursorMoving it is updating the draftLayer every milisecond. on up we can finally set the layer in our layer arrays and simply map that mf on the on svg LIKE A REAL TOP G 