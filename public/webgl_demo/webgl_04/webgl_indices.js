var cubeRotation = 0.0;

main();

function main()
{
	const canvas = document.querySelector('#glcanvas');
	const gl = canvas.getContext('webgl');
	if(!gl){
		alert("Initialize webgl failed. Your browser or machine may not support it.");
		return;
	}

	//ctx = WebGLDebugUtils.makeDebugContext(gl);

	//vertex shader
	const vsSource = `
		attribute vec4 vPos;
		attribute vec4 vColor;

		uniform mat4 uModelViewMatrix;
		uniform mat4 uProjectionMatrix;

		varying lowp vec4 vFragColor;

		void main(){
			gl_Position = uProjectionMatrix * uModelViewMatrix * vPos;
			vFragColor = vColor;
		}
	`;

	//fragment shader
	const fsSource = `
		varying lowp vec4 vFragColor;
		
		void main(){
			gl_FragColor = vFragColor;
		}
	`;

	//create a shader program
	const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

	//collect paramters from shader program
	const programInfo = {
		program: shaderProgram,
		attribs: {
			vertexPosition: gl.getAttribLocation(shaderProgram, "vPos"),
			vertexColor: gl.getAttribLocation(shaderProgram, "vColor"),
		},

		uniforms: {
			projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),
			modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
		},
	};

	//create and fill buffers
	const buffers = initBuffers(gl);

	var then = 0;

	//main loop
	function render(now)
	{
		now *= 0.001;
		const deltaTime = now - then;
		then = now;

		//draw scene
		drawScene(gl, programInfo, buffers, deltaTime);

		requestAnimationFrame(render);
	}
	requestAnimationFrame(render);
}


//create and fill buffers
function initBuffers(gl)
{
	//set up positions
	const positions = [
		// Front face
		-1.0, -1.0,  1.0,
		 1.0, -1.0,  1.0,
		 1.0,  1.0,  1.0,
		-1.0,  1.0,  1.0,

		// Back face
		-1.0, -1.0, -1.0,
		-1.0,  1.0, -1.0,
		 1.0,  1.0, -1.0,
		 1.0, -1.0, -1.0,

		// Top face
		-1.0,  1.0, -1.0,
		-1.0,  1.0,  1.0,
		 1.0,  1.0,  1.0,
		 1.0,  1.0, -1.0,

		// Bottom face
		-1.0, -1.0, -1.0,
		 1.0, -1.0, -1.0,
		 1.0, -1.0,  1.0,
		-1.0, -1.0,  1.0,

		// Right face
		 1.0, -1.0, -1.0,
		 1.0,  1.0, -1.0,
		 1.0,  1.0,  1.0,
		 1.0, -1.0,  1.0,

		// Left face
		-1.0, -1.0, -1.0,
		-1.0, -1.0,  1.0,
		-1.0,  1.0,  1.0,
		-1.0,  1.0, -1.0,
	];

	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

	//set up colors
	const faceColors = [
		[1.0,  1.0,  1.0,  1.0],    // Front face: white
		[1.0,  0.0,  0.0,  1.0],    // Back face: red
		[0.0,  1.0,  0.0,  1.0],    // Top face: green
		[0.0,  0.0,  1.0,  1.0],    // Bottom face: blue
		[1.0,  1.0,  0.0,  1.0],    // Right face: yellow
		[1.0,  0.0,  1.0,  1.0],    // Left face: purple
	];
	var colors = [];
	for(var j=0; j<faceColors.length; ++j)
	{
		const c = faceColors[j];
		//repeat each color 4 times for the 4 vertices of one face
		colors = colors.concat(c, c, c, c)
	}
	const colorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

	//set up indices
	const indices = [
		0,  1,  2,      0,  2,  3,    // front
		4,  5,  6,      4,  6,  7,    // back
		8,  9,  10,     8,  10, 11,   // top
		12, 13, 14,     12, 14, 15,   // bottom
		16, 17, 18,     16, 18, 19,   // right
		20, 21, 22,     20, 22, 23,   // left
	];
	const indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

	//return buffer obj
	return { 
		position: positionBuffer,
		color: colorBuffer,
		indices: indexBuffer,
	};
}

//draw scene
function drawScene(gl, programInfo, buffers, deltaTime)
{
	//clear everything
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clearDepth(1.0);
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);  //近处的物体挡住远处的物体

	gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

	//create projection matrix
	const FOV = 45 * Math.PI / 180.0; // fov in radians
	const Aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
	const zNear = 0.1;
	const zFar = 100.0;
	const projectionMatrix = mat4.create();
	mat4.perspective(projectionMatrix, FOV, Aspect, zNear, zFar); //gl_matrix.js( create a projection matrix )

	//init model view matrix
	const modelViewMatrix = mat4.create();
	mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -6.0]);
	mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation, [0, 0, 1]);  // rotate with axis
	mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation * 0.7, [0, 1, 0]);  // rotate with axis


	//transport position to gpu
	{
		const numComponents = 3;
		const type = gl.FLOAT;
		const normalize = false;
		const stride = 0;
		const offset = 0;
		gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position); //bind buffer
		gl.vertexAttribPointer(
			programInfo.attribs.vertexPosition,  //attrib index
			numComponents,
			type,
			normalize,
			stride,
			offset,
		);
		gl.enableVertexAttribArray(programInfo.attribs.vertexPosition);
	}

	//transport color to gpu
	{
		const numComponents = 4;
		const type = gl.FLOAT;
		const normalize = false;
		const stride = 0;
		const offset = 0;
		gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
		gl.vertexAttribPointer(
			programInfo.attribs.vertexColor,
			numComponents,
			type,
			normalize,
			stride,
			offset
		);
		gl.enableVertexAttribArray(programInfo.attribs.vertexColor);
	}

	//transport indices
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

	//use shader program
	gl.useProgram(programInfo.program);

	//set uniforms
	gl.uniformMatrix4fv(programInfo.uniforms.projectionMatrix, false, projectionMatrix);
	gl.uniformMatrix4fv(programInfo.uniforms.modelViewMatrix, false, modelViewMatrix);

	//draw call
	{
		const vertexCount = 36;
		const offset = 0;
		const type = gl.UNSIGNED_SHORT;
		gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
	}

	//update rotation
	cubeRotation += deltaTime;
}

function initShaderProgram(gl, vsSource, fsSource)
{
	const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
	const fragShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

	//create shader program
	const shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragShader);
	gl.linkProgram(shaderProgram);

	//check
	if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
	{
		alert('Unable to create shader program: ' + gl.getProgramInfoLog(shaderProgram));
		return null;
	}
	return shaderProgram;
}

function loadShader(gl, type, source)
{
	const shader = gl.createShader(type);

	gl.shaderSource(shader, source);
	gl.compileShader(shader);

	//check
	if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
	{
		alert('An error occurred when compiling shader: ' + gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
		return null;
	}

	return shader;
}