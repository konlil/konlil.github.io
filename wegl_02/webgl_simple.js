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

		uniform mat4 uModelViewMatrix;
		uniform mat4 uProjectionMatrix;

		void main(){
			gl_Position = uProjectionMatrix * uModelViewMatrix * vPos;
		}
	`;

	//fragment shader
	const fsSource = `
		void main(){
			gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
		}
	`;

	//create a shader program
	const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

	//collect paramters from shader program
	const programInfo = {
		program: shaderProgram,
		attribs: {
			vertexPosition: gl.getAttribLocation(shaderProgram, "vPos"),
		},

		uniforms: {
			projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),
			modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
		},
	};

	//create and fill buffers
	const buffers = initBuffers(gl);

	//draw scene
	drawScene(gl, programInfo, buffers);
}


//create and fill buffers
function initBuffers(gl)
{
	const positionBuffer = gl.createBuffer();

	//bind buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

	//create positions of a square
	const positions = [
		1.0, 1.0,
		-1.0, 1.0,
		1.0, -1.0,
		-1.0, -1.0,
	];

	//fill gl buffer
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

	//return buffer obj
	return { 
		position: positionBuffer, 
	};
}

//draw scene
function drawScene(gl, programInfo, buffers)
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

	//transport data to gpu
	{
		const num = 2;  // a square = 2 triangles
		const type = gl.FLOAT;
		const normalize = false;
		const stride = 0;
		const offset = 0;
		gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position); //bind buffer
		gl.vertexAttribPointer(
			programInfo.attribs.vertexPosition,  //attrib index
			num,
			type,
			normalize,
			stride,
			offset,
		);
		gl.enableVertexAttribArray(programInfo.attribs.vertexPosition);
	}

	//use shader program
	gl.useProgram(programInfo.program);

	//set uniforms
	gl.uniformMatrix4fv(programInfo.uniforms.projectionMatrix, false, projectionMatrix);
	gl.uniformMatrix4fv(programInfo.uniforms.modelViewMatrix, false, modelViewMatrix);

	//draw call
	{
		const offset = 0;
		const vertexCount = 4;
		gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
	}
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