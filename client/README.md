### Understanding Random Stuff

1. what does memo and forward ref works?
ans: In memo component if the props are same as before then it will not re-render the component but if the props are changed then it will re-render the component this might sound simple but in the svg based canva the amount of rendering is of the biggest bottleneck. so it improves the performance a lot. 

For the forward ref it takes two props the actual props and ref it allows us to use ref on a component. Like A html element has ref but a component doesn't have ref so we use forward ref to use ref on a component.